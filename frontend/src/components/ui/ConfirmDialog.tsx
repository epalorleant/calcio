import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { useTranslation } from "../../i18n/useTranslation";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      setOpen(false);
      resolver?.(result);
      setResolver(null);
      setOptions(null);
    },
    [resolver],
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <Modal
          open={open}
          onClose={() => close(false)}
          title={options.title ?? t.confirmAction ?? "Confirm"}
          size="sm"
        >
          <p style={{ margin: "0 0 1rem" }}>{options.message}</p>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => close(false)}>
              {options.cancelLabel ?? t.cancel}
            </button>
            <button
              type="button"
              className={`btn ${options.variant === "danger" ? "btn-danger" : "btn-primary"}`}
              onClick={() => close(true)}
            >
              {options.confirmLabel ?? t.confirm ?? "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
}
