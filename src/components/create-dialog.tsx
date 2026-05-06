"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function CreateDialog({
  title,
  description,
  trigger,
  disabled,
  children,
}: {
  title: string;
  description?: string;
  trigger: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previousActiveElement?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        type="button"
      >
        {trigger}
      </button>
      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 py-10 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
          role="dialog"
        >
          <section
            ref={panelRef}
            className="max-h-[calc(100vh-5rem)] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl outline-none"
            onMouseDown={(event) => event.stopPropagation()}
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                type="button"
              >
                Close
              </button>
            </div>
            <div className="p-5">{children}</div>
          </section>
        </div>
      ) : null}
    </>
  );
}
