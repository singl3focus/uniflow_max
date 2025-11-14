import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Task, Context } from '../types/api';
import { useToast } from '../contexts/ToastContext';
import { debounce } from '../lib/debounce';
import { TaskCard } from '../components/TaskCard';
import { ContextCard } from '../components/ContextCard';
import LoupeIcon from '../materials/loupe-search-svgrepo-com.svg';

function SearchPageSimple() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    console.log('[SearchPage] Searching for:', searchQuery);

    try {
      const results = await apiClient.search(searchQuery);
      console.log('[SearchPage] Search results:', results);
      setTasks(results.tasks || []);
      setContexts(results.contexts || []);
    } catch (error: any) {
      console.error('[SearchPage] Search failed:', error);
      showError('Не удалось выполнить поиск');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Create debounced version
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => performSearch(searchQuery), 500),
    [performSearch]
  );

  // Auto-search when query changes
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query);
    }
  }, [query, debouncedSearch]);

  // Restore state when returning from detail pages
  useEffect(() => {
    if (location.state?.searchState) {
      const { query, tasks, contexts, searched } = location.state.searchState;
      setQuery(query);
      setTasks(tasks);
      setContexts(contexts);
      setSearched(searched);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const handleSearch = () => {
    performSearch(query);
  };

  const totalResults = tasks.length + contexts.length;

  return (
    <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <h1>Поиск</h1>
        </div>
      </div>

      {/* Search input */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="form-input"
            placeholder="Поиск задач и контекстов..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1000, margin: 0 }}
          />
          <button 
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{ 
              flex: 125,
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <span style={{ fontSize: '20px' }}>⏳</span>
            ) : (
              <img 
                src={LoupeIcon} 
                alt="Поиск" 
                style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }}
              />
            )}
          </button>
        </div>
        {searched && !loading && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
            Найдено результатов: {totalResults}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="empty-state">Загрузка...</div>
      ) : !searched ? (
        <div className="section">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#333' }}>
              Начните поиск
            </div>
            <div>Введите запрос для поиска задач и контекстов</div>
          </div>
        </div>
      ) : totalResults === 0 ? (
        <div className="section">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤷</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#333' }}>
              Ничего не найдено
            </div>
            <div>Попробуйте изменить запрос</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {/* Contexts results */}
          {contexts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#666' }}>
                Контексты ({contexts.length})
              </div>
              <div style={{ margin: 0 }}>
                {contexts.map((ctx) => (
                  <ContextCard
                    key={ctx.id}
                    context={ctx}
                    onClick={() => navigate(`/contexts/${ctx.id}`, {
                      state: { from: '/search', searchState: { query, tasks, contexts, searched } }
                    })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tasks results */}
          {tasks.length > 0 && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#666' }}>
                Задачи ({tasks.length})
              </div>
              <div className="section" style={{ margin: 0 }}>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => navigate(`/tasks/${task.id}`, {
                      state: { from: '/search', searchState: { query, tasks, contexts, searched } }
                    })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div className="nav">
        <button className="nav-item" onClick={() => navigate('/today')}>
          <div className="nav-icon">📅</div>
          <div>Расписание</div>
        </button>
        <button className="nav-item" onClick={() => navigate('/contexts')}>
          <div className="nav-icon">📚</div>
          <div>Контексты</div>
        </button>
        <button className="nav-item" onClick={() => navigate('/inbox')}>
          <div className="nav-icon">📥</div>
          <div>Входящие</div>
        </button>
        <button className="nav-item active" onClick={() => navigate('/search')}>
          <div className="nav-icon">🔍</div>
          <div>Поиск</div>
        </button>
      </div>
    </div>
  );
}

export default SearchPageSimple;
