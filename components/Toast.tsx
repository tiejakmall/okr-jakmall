"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: string; message: string; type: ToastType; }

interface ToastCtx {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastCtx>({
  success: () => {}, error: () => {}, warning: () => {}, info: () => {},
});

export function useToast() { return useContext(ToastContext); }

const STYLES: Record<ToastType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: CheckCircle2 },
  error:   { bg: "bg-red-50",   border: "border-red-200",   text: "text-red-800",   icon: XCircle },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: AlertTriangle },
  info:    { bg: "bg-blue-50",  border: "border-blue-200",  text: "text-blue-800",  icon: Info },
};

function ToastItem({ t, onClose }: { t: Toast; onClose: () => void }) {
  const s = STYLES[t.type];
  const Icon = s.icon;
  return (
    <div className={`flex items-start gap-3 ${s.bg} ${s.border} border rounded-xl px-4 py-3 shadow-lg pointer-events-auto w-80 toast-enter`}>
      <Icon size={15} className={`${s.text} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm font-medium ${s.text} flex-1 leading-snug`}>{t.message}</p>
      <button onClick={onClose} className={`${s.text} opacity-50 hover:opacity-100 transition flex-shrink-0`}>
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const ctx: ToastCtx = {
    success: (msg) => add(msg, "success"),
    error:   (msg) => add(msg, "error"),
    warning: (msg) => add(msg, "warning"),
    info:    (msg) => add(msg, "info"),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
