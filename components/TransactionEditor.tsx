import React, { useId, useRef, useState } from 'react';
import type { Transaction, Subcategories } from '../types';
import type { TransactionWriteResult } from '../hooks/useBudget';
import { draftInput, transactionDraft, transactionDraftError } from '../utils/transactions';
import Dialog from './Dialog';
import TransactionFields, { TRANSACTION_PRIMARY, TRANSACTION_SECONDARY } from './TransactionFields';

interface TransactionEditorProps {
  transaction: Transaction;
  selectedMonth: string;
  subcategories: Subcategories;
  onSave: (transaction: Transaction) => Promise<TransactionWriteResult>;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

const TransactionEditor: React.FC<TransactionEditorProps> = ({ transaction, selectedMonth, subcategories, onSave, onClose, returnFocusRef }) => {
  const id = useId();
  const [draft, setDraft] = useState(() => transactionDraft(selectedMonth, transaction));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current || uncertain) return;
    const validation = transactionDraftError(draft, selectedMonth);
    if (validation) { setError(validation); return; }
    // Historical names are identifiers too; an unchanged orphan must retain its exact name.
    const input = { ...draftInput(draft), subcategory: draft.subcategory };
    if (!subcategories[input.category]?.some(sub => sub.name === input.subcategory)
      && !(input.category === transaction.category && input.subcategory === transaction.subcategory)) {
      setError('Choose an existing subcategory for this category.'); return;
    }
    busyRef.current = true; setBusy(true); setError(null);
    try {
      const result = await onSave({ ...transaction, ...input });
      if (result.error) { setError(result.error); setUncertain(!!result.uncertain); }
      else onClose();
    } catch {
      setError('Could not confirm whether this transaction was saved. Reload activity before trying again.');
      setUncertain(true);
    } finally { busyRef.current = false; setBusy(false); }
  };
  return (
    <Dialog title="Edit transaction" description="Update the recorded details for this month." onClose={onClose} busy={busy} returnFocusRef={returnFocusRef} footer={
      <div className="flex flex-col gap-2">
        {uncertain ? <button type="button" onClick={() => window.location.reload()} className={TRANSACTION_PRIMARY}>Reload activity</button> : <button type="submit" form={id} disabled={busy} className={TRANSACTION_PRIMARY}>{busy ? 'Saving…' : 'Save changes'}</button>}
        <button type="button" onClick={onClose} disabled={busy} className={TRANSACTION_SECONDARY}>{uncertain ? 'Close' : 'Cancel'}</button>
      </div>
    }>
      {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
      <form id={id} onSubmit={save}>
        <fieldset disabled={busy || uncertain} className="min-w-0 disabled:opacity-60">
          <TransactionFields draft={draft} onChange={patch => setDraft(current => ({ ...current, ...patch }))} selectedMonth={selectedMonth} subcategories={subcategories} retainedSubcategory={{ category: transaction.category, name: transaction.subcategory }} />
        </fieldset>
      </form>
      {busy && <p role="status" className="sr-only">Saving your transaction.</p>}
    </Dialog>
  );
};
export default TransactionEditor;
