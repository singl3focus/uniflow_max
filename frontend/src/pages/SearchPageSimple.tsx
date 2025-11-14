import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Task, Context } from '../types/api';
import LoupeIcon from '../materials/loupe-search-svgrepo-com.svg';

function SearchPageSimple() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Restore state when returning from detail pages
  useEffect(() => {
    if (location.state?.searchState) {
      const { query, tasks, contexts, searched } = location.state.searchState;
      setQuery(query);
      setTasks(tasks);
      setContexts(contexts);
      setSearched(searched);
      // Clear the state to avoid restoring again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    console.log('[SearchPage] Searching for:', query);

    try {
      const results = await apiClient.search(query);
      console.log('[SearchPage] Search results:', results);
      console.log('[SearchPage] Tasks:', results.tasks);
      console.log('[SearchPage] Contexts:', results.contexts);
      setTasks(results.tasks || []);
      setContexts(results.contexts || []);
    } catch (error) {
      console.error('[SearchPage] Search failed:', error);
    } finally {
      setLoading(false);
    }
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
                  <div
                    key={ctx.id}
                    className="context-card"
                    style={{ borderLeftColor: ctx.color || '#667eea', margin: '0 0 12px 0' }}
                    onClick={() => navigate(`/contexts/${ctx.id}`, {
                      state: { from: '/search', searchState: { query, tasks, contexts, searched } }
                    })}
                  >
                    <div className="context-header">
                      <div className="context-title">{ctx.title}</div>
                      <div className="context-type">
                        {ctx.type === 'subject' ? 'Предмет' : 
                         ctx.type === 'project' ? 'Проект' : 
                         ctx.type === 'personal' ? 'Личное' : 
                         ctx.type === 'work' ? 'Работа' : 'Другое'}
                      </div>
                    </div>
                    {ctx.description && (
                      <div className="context-description">{ctx.description}</div>
                    )}
                  </div>
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
                  <div
                    key={task.id}
                    className="task-item"
                  >
                    <div className="task-checkbox">
                      <input 
                        type="checkbox" 
                        checked={task.status === 'completed'}
                        readOnly
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                    <div className="task-content" onClick={() => navigate(`/tasks/${task.id}`, {
                      state: { from: '/search', searchState: { query, tasks, contexts, searched } }
                    })}>
                      <div className="task-header">
                        <div className="task-color-indicator" style={{ background: task.status === 'completed' ? '#10B981' : '#3B82F6' }}></div>
                        <div className={`task-text ${task.status === 'completed' ? 'completed' : ''}`}>
                          {task.title}
                        </div>
                      </div>
                      {task.description && (
                        <div className="task-meta">
                          <span>{task.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
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
