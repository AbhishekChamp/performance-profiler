import { useEffect } from 'react';
import { useCelebration } from '@/hooks/useCelebration';

interface ConfettiTriggerProps {
  score: number;
  triggerOnMount?: boolean;
}

/**
 * Component that triggers confetti animation when score is excellent (90+)
 * Place this component where you want the celebration to trigger
 */
export function ConfettiTrigger({ score, triggerOnMount = true }: ConfettiTriggerProps): null {
  const { triggerScoreCelebration, resetCelebration } = useCelebration();

  useEffect(() => {
    if (!triggerOnMount) return;

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      triggerScoreCelebration(score);
    }, 500);

    return () => {
      clearTimeout(timer);
      resetCelebration();
    };
  }, [score, triggerOnMount, triggerScoreCelebration, resetCelebration]);

  // This component doesn't render anything visible
  return null;
}

interface ScoreCelebrationProps {
  children: React.ReactNode;
  score: number;
}

/**
 * Wrapper component that triggers confetti when score meets threshold
 */
export function ScoreCelebration({ children, score }: ScoreCelebrationProps): JSX.Element {
  return (
    <>
      <ConfettiTrigger score={score} />
      {children}
    </>
  );
}
