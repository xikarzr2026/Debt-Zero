'use client';

import React, { useEffect, useId, useRef } from 'react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  labelledBy?: string;
  panelClassName?: string;
  /** Skip the default padding and scrolling so the child can lay out its own header, body and footer. */
  bare?: boolean;
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  children,
  labelledBy,
  panelClassName = 'max-w-lg',
  bare = false,
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Parents pass inline onClose handlers; reading it through a ref keeps the focus effect
  // from re-running (and stealing focus from inputs) on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = () =>
      panel?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) ?? [];
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(focusable()).filter((el) => !el.hasAttribute('disabled'));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs cursor-default"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || titleId}
        className={
          bare
            ? `relative w-full z-10 ${panelClassName}`
            : `relative w-full ${panelClassName} rounded-2xl bg-white border-2 border-amber-200 shadow-2xl p-6 z-10 max-h-[92vh] overflow-y-auto`
        }
      >
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
