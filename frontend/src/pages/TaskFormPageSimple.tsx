import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Context, Task } from '../types/api';

function TaskFormPageSimple() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id && id !== 'new';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [contextId, setContextId] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    
    loadContexts();
    if (isEditing) {
      loadTask(id);
    }
  }, [id, isEditing]);

  const loadContexts = async () => {
    try {
      const data = await apiClient.getContexts();
      setContexts(data);
    } catch (err) {
      console.error('Failed to load contexts', err);
    }
  };

  const loadTask = async (taskId: string) => {
    setLoading(true);
    try {
      const task = await apiClient.getTask(taskId);
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setContextId(task.context_id || null);
      
      if (task.due_at) {
        const dueDate = new Date(task.due_at);
        setDueAt(dueDate.toISOString().split('T')[0]);
        setDueTime(dueDate.toTimeString().slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load task', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Введите название задачи');
      return;
    }

    const combinedDueAt = dueAt && dueTime
      ? new Date(`${dueAt}T${dueTime}:00`).toISOString()
      : dueAt
      ? new Date(`${dueAt}T00:00:00`).toISOString()
      : null;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      context_id: contextId,
      due_at: combinedDueAt,
    };

    try {
      if (isEditing) {
        await apiClient.updateTask(id, taskData);
      } else {
        await apiClient.createTask(taskData);
      }
      navigate('/today');
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Ошибка при сохранении задачи');
    }
  };

  if (loading) {
    return (
      <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
        <div className="header">
          <div className="header-top">
            <button className="back-button" onClick={() => navigate('/today')}>← Назад</button>
            <h1>Задача</h1>
            <div style={{ width: '48px' }}></div>
          </div>
        </div>
        <div className="empty-state">Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/today')}>← Назад</button>
          <h1>{isEditing ? 'Редактировать' : 'Новая задача'}</h1>
          <div style={{ width: '48px' }}></div>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: 'white', margin: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px' }}>
        <div className="form-group">
          <label className="form-label">Название *</label>
          <input 
            className="form-input"
            placeholder="Название задачи" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea 
            className="form-textarea"
            placeholder="Описание задачи" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Статус</label>
          <select 
            className="form-select"
            value={status} 
            onChange={(e) => setStatus(e.target.value as Task['status'])}
          >
            <option value="todo">К выполнению</option>
            <option value="completed">Завершена</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Контекст</label>
          <select 
            className="form-select"
            value={contextId || ''} 
            onChange={(e) => setContextId(e.target.value || null)}
          >
            <option value="">Без контекста</option>
            {contexts.map(ctx => (
              <option key={ctx.id} value={ctx.id}>
                {ctx.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Дедлайн</label>
          <input 
            type="datetime-local" 
            className="form-input"
            value={dueAt && dueTime ? `${dueAt}T${dueTime}` : dueAt || ''}
            onChange={(e) => {
              if (e.target.value) {
                const [date, time] = e.target.value.split('T');
                setDueAt(date);
                setDueTime(time);
              } else {
                setDueAt('');
                setDueTime('');
              }
            }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/today')}
            style={{ flex: 1 }}
          >
            Отмена
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            style={{ flex: 1 }}
          >
            {isEditing ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="nav">
        <button className="nav-item active" onClick={() => navigate('/today')}>
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
        <button className="nav-item" onClick={() => navigate('/search')}>
          <div className="nav-icon">🔍</div>
          <div>Поиск</div>
        </button>
      </div>
    </div>
  );
}

export default TaskFormPageSimple;
