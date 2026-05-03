import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-center gap-3 glass-card px-4 py-3 min-w-[250px] max-w-sm rounded-2xl border-l-4 overflow-hidden relative"
              style={{
                borderLeftColor:
                  toast.type === 'success' ? '#10b981' :
                  toast.type === 'error' ? '#ef4444' : '#6366f1'
              }}
            >
              {toast.type === 'success' && <CheckCircle className="text-accent-success" size={20} />}
              {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
              {toast.type === 'info' && <Info className="text-primary" size={20} />}
              
              <p className="text-sm font-medium flex-1 text-gray-200">
                {toast.message}
              </p>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
