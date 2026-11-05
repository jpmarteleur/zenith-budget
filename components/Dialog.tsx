import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import XIcon from './icons/XIcon';

interface DialogProps {
  title: string;
  description: string;
  onClose: () => void;
  busy?: boolean;
  compact?: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

const Dialog: React.FC<DialogProps> = ({
  title, description, onClose, busy = false, compact = false, children, footer, returnFocusRef,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      const target = trigger?.isConnected && !trigger.matches(':disabled') ? trigger : returnFocusRef?.current;
      target?.focus();
    };
  }, [returnFocusRef]);

  useEffect(() => {
    if (busy) dialogRef.current?.focus();
  }, [busy]);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={busy}
      tabIndex={-1}
      onKeyDown={(event: React.KeyboardEvent<HTMLDialogElement>) => {
        if (event.key !== 'Tab') return;
        const dialog: HTMLDialogElement = event.currentTarget;
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]'))
          .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          event.currentTarget.focus();
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={event => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={event => {
        if (event.target !== event.currentTarget || busy) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none max-h-[calc(100dvh-1rem)] overflow-hidden rounded-t-3xl border border-black/10 bg-white p-0 text-black/87 shadow-nav backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:inset-0 sm:m-auto sm:max-w-lg sm:rounded-2xl"
    >
      <div className="flex max-h-[calc(100dvh-1rem-2px)] flex-col sm:max-h-[calc(100dvh-3rem)]">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-black/20 sm:hidden" aria-hidden="true" />
        <header className={`flex shrink-0 items-start justify-between gap-3 px-5 sm:px-6 ${compact ? 'py-3' : 'pb-4 pt-4 sm:pt-6'}`}>
          <div>
            <h2 id={titleId} className={`${compact ? 'text-lg' : 'text-xl'} font-semibold tracking-tight text-house-green`}>{title}</h2>
            <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-black/60">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={`Close ${title.toLowerCase()}`}
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black/60 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green disabled:opacity-40"
          >
            <span aria-hidden="true"><XIcon className="h-5 w-5" /></span>
          </button>
        </header>
        <div className={`min-h-0 overflow-y-auto overscroll-contain border-t border-black/5 px-5 sm:px-6 ${compact ? 'py-3' : 'py-5'}`}>{children}</div>
        <footer className={`shrink-0 border-t border-black/10 bg-white px-5 sm:px-6 ${compact ? 'pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]' : 'pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]'}`}>{footer}</footer>
      </div>
    </dialog>,
    document.body,
  );
};

export default Dialog;
