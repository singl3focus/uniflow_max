import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setBackButtonVisible, onBackButtonClick } from '../lib/maxBridge';

/**
 * Hook для управления кнопкой "Назад" в MAX
 * Автоматически показывает/скрывает кнопку и обрабатывает клики
 */
export function useMaxBackButton(enabled: boolean = true) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled) {
      setBackButtonVisible(false);
      return;
    }

    // Показываем кнопку "Назад" на всех страницах кроме главной
    const isMainPage = location.pathname === '/' || location.pathname === '/today';
    setBackButtonVisible(!isMainPage);

    // Обработчик клика по кнопке "Назад"
    const unsubscribe = onBackButtonClick(() => {
      navigate(-1);
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, location.pathname, navigate]);
}
