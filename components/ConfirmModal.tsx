"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm() { return useContext(ConfirmContext); }

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => setState({ ...opts, resolve }));
  }, []);

  function close(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="font-bold text-slate-900 text-base mb-1">{state.title}</h3>
            {state.message && <p className="text-sm text-slate-500 mb-5 leading-relaxed">{state.message}</p>}
            {!state.message && <div className="mb-5" />}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl
                  shadow-[0_3px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-px transition-all duration-75"
              >
                Batal
              </button>
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-75
                  ${state.danger
                    ? "bg-red-500 text-white shadow-[0_3px_0_#b91c1c] hover:shadow-[0_1px_0_#b91c1c] hover:translate-y-px"
                    : "bg-amber-400 text-gray-900 shadow-[0_3px_0_#d97706] hover:shadow-[0_1px_0_#d97706] hover:translate-y-px"
                  }`}
              >
                {state.confirmLabel ?? (state.danger ? "Hapus" : "Ya, Lanjutkan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
