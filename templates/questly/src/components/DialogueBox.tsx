import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DialogueBoxProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'npc' | 'quest' | 'location' | 'info';
  onEdit?: () => void; // Optional edit handler for NPCs
}

export default function DialogueBox({ 
  isOpen, 
  title, 
  message, 
  onClose,
  type = 'info',
  onEdit
}: DialogueBoxProps) {
  if (!isOpen) return null;

  const getTypeColor = () => {
    switch (type) {
      case 'npc':
        return 'bg-blue-600 border-blue-500';
      case 'quest':
        return 'bg-purple-600 border-purple-500';
      case 'location':
        return 'bg-green-600 border-green-500';
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4"
        >
          <div className={`${getTypeColor()} border-2 rounded-lg shadow-2xl p-3 md:p-4 backdrop-blur-sm`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                {type === 'npc' && '💬'}
                {type === 'quest' && '⚔️'}
                {type === 'location' && '📍'}
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded"
                aria-label="Close dialogue"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Message */}
            <div className="text-white/90 text-sm md:text-base leading-relaxed mb-4">
              {message.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              {type === 'npc' && onEdit && (
                <button
                  onClick={onEdit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  ✏️ Edit Dialogue
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
