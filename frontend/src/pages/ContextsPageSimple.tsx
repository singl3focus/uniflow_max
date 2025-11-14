import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Context } from '../types/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function ContextsPageSimple() {
  const navigate = useNavigate();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#667eea');
  const [newType, setNewType] = useState<Context['type']>('project');
  const [newDeadline, setNewDeadline] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadContexts();
  }, []);

  const loadContexts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getContexts();
      console.log('[ContextsPage] Loaded contexts:', data);
      console.log('[ContextsPage] First context:', data[0]);
      setContexts(data);
    } catch (err) {
      console.error('Failed loading contexts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const newContext = await apiClient.createContext({
        type: newType,
        title: newTitle || 'Без названия',
        description: newDescription || '',
        subject_id: null,
        color: newColor,
        deadline_at: newDeadline || null,
      });

      setContexts([newContext, ...contexts]);
      setCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
    } catch (error) {
      console.error('Failed to create context:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'subject': 'Учебный предмет',
      'project': 'Проект',
      'personal': 'Личное',
      'work': 'Работа',
      'other': 'Другое'
    };
    return labels[type] || type;
  };

  return (
    <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <h1>Контексты</h1>
        </div>
      </div>

      {/* Search and create */}
      <div style={{ padding: '12px 16px', background: 'white', margin: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input 
            placeholder="Поиск по контекстам..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="form-input"
            style={{ flex: 1, margin: 0 }}
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setCreateOpen(true)}
          style={{ width: '100%' }}
        >
          Создать контекст
        </button>
      </div>

      {/* Contexts list */}
      {loading ? (
        <div className="empty-state">Загрузка...</div>
      ) : contexts.length === 0 ? (
        <div className="section">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#333' }}>
              Нет контекстов
            </div>
            <div>Создайте новый контекст, чтобы начать работу</div>
          </div>
        </div>
      ) : (
        <div style={{ margin: '0 0 12px 0' }}>
          {contexts
            .filter((c) => {
              if (!filter) return true;
              const q = filter.toLowerCase();
              return c.title.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
            })
            .map((c) => (
            <div
              key={c.id}
              className="context-card"
              style={{ borderLeftColor: c.color || '#667eea' }}
              onClick={() => navigate(`/contexts/${c.id}`)}
            >
              <div className="context-header">
                <div className="context-title">{c.title}</div>
                <div className="context-type">{getTypeLabel(c.type)}</div>
              </div>
              {c.description && (
                <div className="context-description">{c.description}</div>
              )}
              {c.deadline_at && (
                <div className="context-meta">
                  <span>📅 до {format(parseISO(c.deadline_at), 'd MMM', { locale: ru })}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}
          onClick={() => setCreateOpen(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Создать контекст</h2>
            
            <div className="form-group">
              <label className="form-label">Название *обязательно</label>
              <input 
                className="form-input"
                placeholder="Название контекста" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea 
                className="form-textarea"
                placeholder="Описание" 
                value={newDescription} 
                onChange={(e) => setNewDescription(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Тип</label>
              <select 
                className="form-select"
                value={newType} 
                onChange={(e) => setNewType(e.target.value as Context['type'])}
              >
                <option value="subject">Учебный предмет</option>
                <option value="project">Проект</option>
                <option value="personal">Личное</option>
                <option value="work">Работа</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Цвет</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#667eea', '#f093fb', '#f44336', '#4CAF50', '#ff9800', '#9c27b0', '#009688', '#2196F3', '#E91E63', '#FFC107', '#795548', '#607D8B', '#FF5722', '#00BCD4'].map(color => (
                  <div
                    key={color}
                    onClick={() => setNewColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: color,
                      cursor: 'pointer',
                      border: newColor === color ? '3px solid #333' : '1px solid #ddd'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Дедлайн</label>
              <input 
                type="datetime-local" 
                className="form-input"
                onChange={(e) => setNewDeadline(e.target.value ? new Date(e.target.value).toISOString() : null)} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="nav">
        <button className="nav-item" onClick={() => navigate('/today')}>
          <div className="nav-icon">📅</div>
          <div>Расписание</div>
        </button>
        <button className="nav-item active" onClick={() => navigate('/contexts')}>
          <div className="nav-icon">📚</div>
          <div>Контексты</div>
        </button>
        <button className="nav-item" onClick={() => navigate('/inbox')}>
          <div className="nav-icon">📥</div>
          <div>Входящие</div>
        </button>
        <button className="nav-item" onClick={() => navigate('/search')}>
          <div className="nav-icon">🔍</div>
          <div>Поиск</div>
        </button>
      </div>
    </div>
  );
}

export default ContextsPageSimple;
