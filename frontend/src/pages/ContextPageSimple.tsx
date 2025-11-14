import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Context } from '../types/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function ContextPageSimple() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [context, setContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#667eea');
  const [editType, setEditType] = useState<Context['type']>('project');
  const [editDeadline, setEditDeadline] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadContext(id);
  }, [id]);

  const loadContext = async (contextId: string) => {
    setLoading(true);
    try {
      const contextData = await apiClient.getContext(contextId);
      setContext(contextData);
      // Инициализируем поля редактирования
      setEditTitle(contextData.title);
      setEditDescription(contextData.description || '');
      setEditColor(contextData.color || '#667eea');
      setEditType(contextData.type);
      setEditDeadline(contextData.deadline_at || null);
    } catch (err) {
      console.error('Failed to load context', err);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    // If came from search, return to search with saved state
    if (location.state?.from === '/search' && location.state?.searchState) {
      navigate('/search', { state: { searchState: location.state.searchState } });
    } else {
      navigate(-1);
    }
  };

  const deleteContext = async () => {
    if (!context || !confirm('Удалить контекст?')) return;
    try {
      await apiClient.deleteContext(context.id);
      navigate('/contexts');
    } catch (err) {
      console.error('Failed to delete context', err);
    }
  };

  const handleUpdate = async () => {
    if (!context) return;
    try {
      const updatedContext = await apiClient.updateContext(context.id, {
        type: editType,
        title: editTitle || 'Без названия',
        description: editDescription || '',
        subject_id: null,
        color: editColor,
        deadline_at: editDeadline || null,
      });
      setContext(updatedContext);
      setEditOpen(false);
    } catch (error) {
      console.error('Failed to update context:', error);
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

  if (loading) {
    return (
      <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
        <div className="header">
          <div className="header-top">
            <button className="back-button" onClick={goBack}>← Назад</button>
            <h1>Контекст</h1>
            <div style={{ width: '48px' }}></div>
          </div>
        </div>
        <div className="empty-state">Загрузка...</div>
      </div>
    );
  }

  if (!context) {
    return (
      <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
        <div className="header">
          <div className="header-top">
            <button className="back-button" onClick={goBack}>← Назад</button>
            <h1>Контекст</h1>
            <div style={{ width: '48px' }}></div>
          </div>
        </div>
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontWeight: 600, fontSize: '16px', color: '#333' }}>Контекст не найден</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <button className="back-button" onClick={goBack}>← Назад</button>
          <h1>{context.title}</h1>
          <div style={{ width: '48px' }}></div>
        </div>
      </div>

      {/* Context detail */}
      <div style={{ background: 'white', margin: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Color indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                background: context.color || '#667eea' 
              }}
            ></div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                {context.title}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {getTypeLabel(context.type)}
              </div>
            </div>
          </div>

          {/* Description */}
          {context.description && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                Описание
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#666' }}>
                {context.description}
              </div>
            </div>
          )}

          {/* Deadline */}
          {context.deadline_at && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                Дедлайн
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {format(parseISO(context.deadline_at), 'd MMMM yyyy', { locale: ru })}
              </div>
            </div>
          )}

          {/* Dates */}
          <div style={{ display: 'flex', gap: '20px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Создан</div>
              <div style={{ fontSize: '13px', color: '#333' }}>
                {format(parseISO(context.created_at), 'd MMM yyyy', { locale: ru })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Обновлён</div>
              <div style={{ fontSize: '13px', color: '#333' }}>
                {format(parseISO(context.updated_at), 'd MMM yyyy', { locale: ru })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={deleteContext}
            >
              Удалить
            </button>
            <button 
              className="btn"
              style={{ flex: 1, border: '1px solid #667eea', background: 'white', color: '#667eea' }}
              onClick={() => setEditOpen(true)}
            >
              Редактировать
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
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
          onClick={() => setEditOpen(false)}
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
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Редактировать контекст</h2>
            
            <div className="form-group">
              <label className="form-label">Название</label>
              <input 
                className="form-input"
                placeholder="Название контекста" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea 
                className="form-textarea"
                placeholder="Описание" 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Тип</label>
              <select 
                className="form-select"
                value={editType} 
                onChange={(e) => setEditType(e.target.value as Context['type'])}
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
                {['#667eea', '#f093fb', '#f44336', '#4CAF50', '#ff9800', '#9c27b0', '#009688'].map(color => (
                  <div
                    key={color}
                    onClick={() => setEditColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: color,
                      cursor: 'pointer',
                      border: editColor === color ? '3px solid #333' : '1px solid #ddd'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Дедлайн (опционально)</label>
              <input 
                type="date" 
                className="form-input"
                value={editDeadline ? editDeadline.split('T')[0] : ''}
                onChange={(e) => setEditDeadline(e.target.value ? new Date(e.target.value).toISOString() : null)} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleUpdate}>
                Сохранить
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

export default ContextPageSimple;
