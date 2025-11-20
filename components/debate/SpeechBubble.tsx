'use client';

import { Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/lib/types';

interface SpeechBubbleProps {
  message: Message;
  position: [number, number, number];
  isVisible: boolean;
}

export function SpeechBubble({ message, position, isVisible }: SpeechBubbleProps) {
  if (!isVisible || !message.content) return null;

  // Limitar o tamanho do texto (mais caracteres para speech bubble)
  const maxLength = 300;
  const displayText = message.content.length > maxLength 
    ? message.content.substring(0, maxLength) + '...' 
    : message.content;

  return (
    <Html position={position} center>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-2xl p-4 pointer-events-none z-50"
            style={{
              transform: 'translate(-50%, -100%)',
              marginBottom: '25px',
              maxWidth: '350px',
              minWidth: '250px',
            }}
          >
            {/* Seta apontando para baixo */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-10 border-r-10 border-t-10 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
            
            {/* Conteúdo */}
            <div className="max-h-28 overflow-y-auto mb-2 pr-1">
              <p className="text-black text-sm leading-relaxed">
                {displayText}
              </p>
            </div>
            
            {/* Ícone de chat abaixo */}
            <div className="mt-2 flex justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}

