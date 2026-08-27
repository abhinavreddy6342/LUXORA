import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useShop } from "../context/ShopContext";

export function ToastContainer() {
  const { toasts, removeToast } = useShop();

  return (
    <div className="aria-live-polite fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="pointer-events-auto flex items-center justify-between gap-3 border border-black/10 bg-white/95 px-5 py-4 text-xs shadow-xl backdrop-blur"
    >
      <div className="flex items-center gap-3">
        {toast.type === "success" && (
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
        )}
        {toast.type === "error" && (
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
        )}
        {toast.type === "info" && (
          <Info size={16} className="shrink-0 text-black" />
        )}
        <span className="font-medium text-neutral-800">{toast.message}</span>
      </div>

      <button
        onClick={onClose}
        className="text-neutral-400 hover:text-black transition-colors"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default ToastContainer;
