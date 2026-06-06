// bm-design-system: toast primitive
//
// A notification toast built on Radix Toast, styled with the design tokens
// (see `.toast*` classes in design-system.css). Mount <ToastProvider> once near
// the app root, then call the imperative API from anywhere inside it:
//
//   const { success, error } = useToast();
//   success("Show created");
//   error("Couldn't save", "Please try again.");
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

interface ToastData {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<ToastData, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((t: Omit<ToastData, "id">) => {
    setToasts((prev) => [...prev, { ...t, id: idCounter++ }]);
  }, []);

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) =>
        toast({ tone: "success", title, description }),
      error: (title, description) => toast({ tone: "error", title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastItem key={t.id} data={t} onRemove={() => remove(t.id)} />
        ))}
        <ToastPrimitive.Viewport className="toast-viewport" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
};

function ToastItem({
  data,
  onRemove,
}: {
  data: ToastData;
  onRemove: () => void;
}) {
  const Icon = toneIcon[data.tone];
  return (
    <ToastPrimitive.Root
      duration={data.duration ?? 4000}
      onOpenChange={(open) => {
        if (!open) onRemove();
      }}
      className={cn(
        "toast",
        data.tone === "success" ? "toast-success" : "toast-error",
      )}
    >
      <Icon className="toast-icon" />
      <div className="toast-content">
        <ToastPrimitive.Title className="toast-title">
          {data.title}
        </ToastPrimitive.Title>
        {data.description ? (
          <ToastPrimitive.Description className="toast-description">
            {data.description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      <ToastPrimitive.Close className="toast-close" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
