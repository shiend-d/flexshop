"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error";
type ToastItem = { id: number; message: string; type: ToastType };
type ToastApi = { toast: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`card-enter pointer-events-auto max-w-xs rounded-xl px-5 py-3 text-[13.5px] font-medium shadow-lg ${
              item.type === "error"
                ? "bg-[#ec003f] text-white"
                : "bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900"
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
