import { motion } from "framer-motion";

export const SubjectModal = ({ open, onClose, subject }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 w-[90%] max-w-md text-white relative"
      >
        
        {/* Закрытие */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-white/80 hover:text-white text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-center">
          Предмет добавлен 🎉
        </h2>

        <p className="text-center text-lg opacity-90">
          Новый предмет: <span className="font-bold">{subject}</span>
        </p>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition"
          >
            Ок
          </button>
        </div>

      </motion.div>
    </div>
  );
};
