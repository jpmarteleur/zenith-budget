import React, { useEffect, useId, useRef, useState } from 'react';
import type { useBudget } from '../hooks/useBudget';
import type { Subcategories } from '../types';
import { parseTransactionText } from '../services/geminiService';
import { draftInput, transactionDraft, transactionDraftError } from '../utils/transactions';
import type { TransactionDraft } from '../utils/transactions';
import Dialog from './Dialog';
import TransactionFields, { TRANSACTION_FOCUS, TRANSACTION_PRIMARY, TRANSACTION_SECONDARY } from './TransactionFields';

interface TransactionFormProps {
  addTransaction: ReturnType<typeof useBudget>['addTransaction'];
  addSubcategory: ReturnType<typeof useBudget>['addSubcategory'];
  subcategories: Subcategories;
  onClose: () => void;
  selectedMonth: string;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ addTransaction, addSubcategory, subcategories, onClose, selectedMonth, returnFocusRef }) => {
  const id = useId();
  const [tab, setTab] = useState<'quick' | 'manual'>('quick');
  const [text, setText] = useState('');
  const [review, setReview] = useState(false);
  const [quickDraft, setQuickDraft] = useState(() => transactionDraft(selectedMonth));
  const [manualDraft, setManualDraft] = useState(() => transactionDraft(selectedMonth));
  const [quickNew, setQuickNew] = useState(false);
  const [manualNew, setManualNew] = useState(false);
  const [plannedAmount, setPlannedAmount] = useState('');
  const [busy, setBusy] = useState<'parse' | 'save' | null>(null);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const createdSubcategories = useRef(new Map<string, string>());
  const parsedText = useRef<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Partial<Record<'quick' | 'manual', HTMLButtonElement | null>>>({});
  const wasReviewing = useRef(false);
  useEffect(() => {
    if (review) amountRef.current?.focus();
    else if (wasReviewing.current) textRef.current?.focus();
    wasReviewing.current = review;
  }, [review]);
  const draft = tab === 'quick' ? quickDraft : manualDraft;
  const creatingNew = tab === 'quick' ? quickNew : manualNew;
  const changeDraft = (patch: Partial<TransactionDraft>) => tab === 'quick' ? setQuickDraft(current => ({ ...current, ...patch })) : setManualDraft(current => ({ ...current, ...patch }));
  const changeCreating = (creating: boolean) => tab === 'quick' ? setQuickNew(creating) : setManualNew(creating);

  const handleParse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || busyRef.current || uncertain) return;
    if (parsedText.current === text) { setReview(true); setError(null); return; }
    busyRef.current = true; setBusy('parse'); setError(null);
    try {
      const parsed = await parseTransactionText(text, subcategories);
      if (!parsed) { setError('Could not read this transaction. Try rephrasing it or choose Manual.'); return; }
      const existing = subcategories[parsed.category]?.find(sub => sub.name.toLowerCase() === parsed.subcategory.toLowerCase());
      parsedText.current = text;
      setQuickDraft(transactionDraft(selectedMonth, { ...parsed, date: quickDraft.date, subcategory: existing?.name ?? parsed.subcategory }));
      setQuickNew(!existing); setPlannedAmount(''); setReview(true);
    } catch {
      setError('Could not read this transaction. Try again or choose Manual.');
    } finally { busyRef.current = false; setBusy(null); }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current || uncertain) return;
    const validation = transactionDraftError(draft, selectedMonth);
    if (validation) { setError(validation); return; }
    const input = draftInput(draft);
    const key = `${input.category}:${input.subcategory.toLowerCase()}`;
    const existing = subcategories[input.category]?.find(sub => sub.name.toLowerCase() === input.subcategory.toLowerCase());
    if (tab === 'quick' && creatingNew && existing && !createdSubcategories.current.has(key)) {
      setError('This subcategory already exists. Choose it from the list instead.'); return;
    }
    let canonicalName = existing?.name ?? createdSubcategories.current.get(key);
    if (!canonicalName && !creatingNew) { setError('Choose an existing subcategory or create one.'); return; }
    const expected = tab === 'quick' && plannedAmount.trim() !== '' ? Number(plannedAmount) : 0;
    if (!canonicalName && !Number.isFinite(expected)) { setError('Enter a valid planned amount for the new subcategory.'); return; }
    busyRef.current = true; setBusy('save'); setError(null);
    let subcategorySaved = !!createdSubcategories.current.get(key);
    try {
      if (!canonicalName) {
        const result = await addSubcategory(input.category, input.subcategory, expected);
        if (result.error) { setError(result.error); return; }
        canonicalName = result.subcategory?.name ?? input.subcategory;
        createdSubcategories.current.set(key, canonicalName);
        subcategorySaved = true;
        changeDraft({ subcategory: canonicalName });
        changeCreating(false);
      }
      const result = await addTransaction({ ...input, subcategory: canonicalName });
      if (result.error) {
        setUncertain(!!result.uncertain);
        setError(`${subcategorySaved ? 'The new subcategory was saved. ' : ''}${result.error}`);
      } else onClose();
    } catch {
      setError('Could not confirm whether this transaction was saved. Reload activity before trying again.');
      setUncertain(true);
    } finally { busyRef.current = false; setBusy(null); }
  };

  const showFields = tab === 'manual' || review;
  return (
    <Dialog title={review ? 'Review transaction' : 'Add transaction'} compact description={review ? 'Check the details before saving.' : tab === 'manual' ? 'Enter the details for this month.' : 'Describe your transaction, then review it.'} onClose={onClose} busy={!!busy} returnFocusRef={returnFocusRef} footer={
      <div className="flex flex-col gap-2">
        {uncertain ? <button type="button" onClick={() => window.location.reload()} className={TRANSACTION_PRIMARY}>Reload activity</button> : <button type="submit" form={`${id}-form`} disabled={!!busy || (!showFields && !text.trim())} className={TRANSACTION_PRIMARY}>{busy === 'parse' ? 'Reading transaction…' : busy === 'save' ? 'Saving…' : showFields ? 'Save transaction' : 'Review transaction'}</button>}
        {review && !uncertain && <button type="button" onClick={() => { setReview(false); setError(null); }} disabled={!!busy} className={TRANSACTION_SECONDARY}>Back to quick entry</button>}
        {!review && <button type="button" onClick={onClose} disabled={!!busy} className={TRANSACTION_SECONDARY}>{uncertain ? 'Close' : 'Cancel'}</button>}
        {review && uncertain && <button type="button" onClick={onClose} className={TRANSACTION_SECONDARY}>Close</button>}
      </div>
    }>
      {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
      {!review && <div role="tablist" aria-label="Transaction entry method" className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-black/5 p-1">
        {(['quick', 'manual'] as const).map(method => <button key={method} ref={element => { tabRefs.current[method] = element; }} type="button" role="tab" id={`${id}-${method}`} aria-selected={tab === method} aria-controls={`${id}-entry`} tabIndex={tab === method ? 0 : -1} disabled={!!busy || uncertain} onClick={() => { setTab(method); setError(null); }} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 'quick' : event.key === 'End' ? 'manual' : method === 'quick' ? 'manual' : 'quick';
          setTab(next); setError(null); tabRefs.current[next]?.focus();
        }} className={`min-h-11 rounded-lg text-sm font-semibold disabled:opacity-50 ${TRANSACTION_FOCUS} ${tab === method ? 'bg-green-mint text-house-green' : 'text-black/60 hover:bg-white/60'}`}>{method === 'quick' ? 'Quick entry' : 'Manual'}</button>)}
      </div>}
      <div id={`${id}-entry`} role={!review ? 'tabpanel' : undefined} aria-labelledby={!review ? `${id}-${tab}` : undefined}>
        <form id={`${id}-form`} onSubmit={showFields ? handleSave : handleParse}>
          <fieldset disabled={!!busy || uncertain} className="min-w-0 disabled:opacity-60">
            {showFields ? <TransactionFields amountRef={amountRef} draft={draft} onChange={changeDraft} selectedMonth={selectedMonth} subcategories={subcategories} creatingNew={creatingNew} onCreatingChange={changeCreating} plannedAmount={plannedAmount} onPlannedAmountChange={tab === 'quick' ? setPlannedAmount : undefined} /> : <div>
              <label htmlFor={`${id}-text`} className="mb-2 block text-sm font-medium text-black/87">What did you spend or receive?</label>
              <input ref={textRef} id={`${id}-text`} required value={text} onChange={event => setText(event.target.value)} placeholder="10 Chipotle" className={`min-h-12 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-3 text-base text-black/87 placeholder:text-black/50 ${TRANSACTION_FOCUS}`} />
              <p className="mt-3 text-sm leading-relaxed text-black/60">Enter an amount and description. Review the suggestions before saving.</p>
            </div>}
          </fieldset>
        </form>
      </div>
      {busy && <p role="status" className="sr-only">{busy === 'parse' ? 'Reading your transaction.' : 'Saving your transaction.'}</p>}
    </Dialog>
  );
};
export default TransactionForm;
