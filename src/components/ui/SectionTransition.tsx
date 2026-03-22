import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function SectionTransition({ 
  children, 
  isVisible,
  direction = 'right'
}: SectionTransitionProps): React.ReactNode {
  const directionOffset = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: -50 },
    down: { x: 0, y: 50 },
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            x: directionOffset[direction].x,
            y: directionOffset[direction].y 
          }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ 
            opacity: 0, 
            x: -directionOffset[direction].x,
            y: -directionOffset[direction].y 
          }}
          transition={{ 
            duration: 0.3, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
