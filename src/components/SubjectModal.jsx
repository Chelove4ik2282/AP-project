import { motion } from "framer-motion";

export const SubjectModal = ({ open, onClose, subject }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50">

      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.7, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-gradient-to-br from-white/20 to-white/5
                   backdrop-blur-2xl border border-white/30 
                   shadow-[0_0_30px_rgba(255,255,255,0.25)]
                   rounded-3xl p-8 w-[90%] max-w-md text-white
                   relative overflow-hidden"
      >

        {/* Glow background circles */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute w-40 h-40 bg-purple-400/30 rounded-full blur-3xl top-1/4 left-1/4"></div>
          <div className="absolute w-40 h-40 bg-blue-400/30 rounded-full blur-3xl bottom-1/4 right-1/4"></div>
        </div> 
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white
                     transition text-2xl leading-none"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold mb-4 text-center drop-shadow-xl">
          Subject Added ✨
        </h2>

        <p className="text-center text-lg opacity-90">
          New subject: <span className="font-extrabold text-white">{subject}</span>
        </p>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="px-7 py-2 text-lg font-medium rounded-2xl
                       bg-white/20 hover:bg-white/30 active:scale-95
                       shadow-md transition-all backdrop-blur-md"
          >
            OK
          </button>
        </div>

      </motion.div>
    </div>
  );
};
