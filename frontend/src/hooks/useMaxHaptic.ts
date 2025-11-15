import { useCallback } from 'react';
import { triggerHaptic } from '../lib/maxBridge';

/**
 * Hook для работы с тактильным откликом MAX
 */
export function useMaxHaptic() {
  const impact = useCallback(() => {
    triggerHaptic('impact');
  }, []);

  const success = useCallback(() => {
    triggerHaptic('success');
  }, []);

  const error = useCallback(() => {
    triggerHaptic('error');
  }, []);

  const warning = useCallback(() => {
    triggerHaptic('warning');
  }, []);

  const selection = useCallback(() => {
    triggerHaptic('selection');
  }, []);

  return {
    impact,
    success,
    error,
    warning,
    selection,
  };
}
