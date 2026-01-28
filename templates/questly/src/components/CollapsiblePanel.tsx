/**
 * CollapsiblePanel - Collapsible side panel with minimize option
 * Mobile-optimized with responsive sizing
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsiblePanelProps {
  children: React.ReactNode;
  title?: string;
  position: 'left' | 'right';
  defaultCollapsed?: boolean;
  width?: string;
  mobileWidth?: string;
  className?: string;
}

export function CollapsiblePanel({
  children,
  title,
  position,
  defaultCollapsed = false,
  width = 'w-64',
  mobileWidth = 'w-full',
  className = '',
}: CollapsiblePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Minimized Bar */}
      {isMinimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute ${position === 'left' ? 'left-0' : 'right-0'} top-20 z-20`}
        >
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-r-lg hover:bg-slate-800 transition-colors"
          >
            <Maximize2 size={16} className="text-slate-300" />
          </button>
        </motion.div>
      )}

      {/* Full Panel */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${position === 'left' ? 'left-0' : 'right-0'} top-20 bottom-4 z-10 ${width} ${mobileWidth} md:${width} bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg overflow-hidden flex flex-col ${className}`}
          >
            {/* Header */}
            {(title || !isCollapsed) && (
              <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
                {title && !isCollapsed && (
                  <h3 className="text-sm font-bold text-slate-300 uppercase">{title}</h3>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 size={14} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {position === 'left' ? (
                      isCollapsed ? (
                        <ChevronRight size={14} className="text-slate-400" />
                      ) : (
                        <ChevronLeft size={14} className="text-slate-400" />
                      )
                    ) : isCollapsed ? (
                      <ChevronLeft size={14} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto p-4"
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed State */}
            {isCollapsed && (
              <div className="p-2">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-full p-2 hover:bg-slate-800 rounded transition-colors"
                >
                  {position === 'left' ? (
                    <ChevronRight size={16} className="text-slate-400 mx-auto" />
                  ) : (
                    <ChevronLeft size={16} className="text-slate-400 mx-auto" />
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
