import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Task } from '../types/api';
import { useToast } from '../contexts/ToastContext';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function TaskPageSimple() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!id || loadedRef.current) return;
    loadedRef.current = true;
    loadTask(id);
  }, [id]);

  const loadTask = async (taskId: string) => {
    setLoading(true);
    try {
      const taskData = await apiClient.getTask(taskId);
      setTask(taskData);
    } catch (err: any) {
      console.error('Failed loading task', err);
      showError('Не удалось загрузить задачу');
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

  const toggleStatus = async () => {
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    console.log('[TaskPage] Toggling status:', { currentStatus: task.status, newStatus, taskId: task.id });
    try {
      await apiClient.updateTaskStatus(task.id, newStatus);
      console.log('[TaskPage] Status updated successfully');
      setTask({ ...task, status: newStatus });
      showSuccess('Статус задачи обновлен');
    } catch (err: any) {
      console.error('[TaskPage] Failed updating task:', err);
      showError('Не удалось обновить статус задачи');
    }
  };

  const deleteTask = async () => {
    if (!task || !confirm('Удалить задачу?')) return;
    try {
      await apiClient.deleteTask(task.id);
      showSuccess('Задача удалена');
      navigate('/today');
    } catch (err: any) {
      console.error('Failed deleting task', err);
      showError('Не удалось удалить задачу');
    }
  };

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      'todo': 'К выполнению',
      'in_progress': 'В процессе',
      'completed': 'Выполнено',
      'cancelled': 'Отменено'
    };
    return statuses[status] || status;
  };

  const getPriorityBadge = (status: string) => {
    const colors: Record<string, string> = {
      'todo': '#3B82F6',
      'in_progress': '#F59E0B',
      'completed': '#10B981',
      'cancelled': '#EF4444'
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return (
      <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
        <div className="header">
          <div className="header-top">
            <button className="back-button" onClick={goBack}>← Назад</button>
            <h1>Задача</h1>
            <div style={{ width: '48px' }}></div>
          </div>
        </div>
        <div className="empty-state">Загрузка...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
        <div className="header">
          <div className="header-top">
            <button className="back-button" onClick={goBack}>← Назад</button>
            <h1>Задача</h1>
            <div style={{ width: '48px' }}></div>
          </div>
        </div>
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontWeight: 600, fontSize: '16px', color: '#333' }}>Задача не найдена</div>
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
          <h1>Задача</h1>
          <div style={{ width: '48px' }}></div>
        </div>
      </div>

      {/* Task detail */}
      <div style={{ background: 'white', margin: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Header section */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <div 
              className={`checkbox ${task.status === 'completed' ? 'checked' : ''}`}
              onClick={toggleStatus}
              style={{ marginTop: '2px', cursor: 'pointer' }}
            ></div>
            <div style={{ flex: 1, fontSize: '18px', fontWeight: 500, lineHeight: '1.4', color: '#333' }}>
              {task.title}
            </div>
          </div>

          {/* Meta information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: '#666', minWidth: '80px' }}>Статус:</div>
              <div 
                style={{ 
                  padding: '4px 12px', 
                  borderRadius: '16px', 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  color: 'white',
                  background: getPriorityBadge(task.status)
                }}
              >
                {getStatusText(task.status)}
              </div>
            </div>

            {task.due_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '14px', color: '#666', minWidth: '80px' }}>Дедлайн:</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  {format(parseISO(task.due_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                </div>
              </div>
            )}

            {task.created_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '14px', color: '#666', minWidth: '80px' }}>Создана:</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  {format(parseISO(task.created_at), 'd MMMM yyyy', { locale: ru })}
                </div>
              </div>
            )}

            {task.context_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '14px', color: '#666', minWidth: '80px' }}>Контекст:</div>
                <div 
                  style={{ 
                    fontSize: '12px', 
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => navigate(`/contexts/${task.context_id}`)}
                >
                  Перейти к контексту
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description section */}
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
            Описание
          </div>
          {task.description ? (
            <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#666' }}>
              {task.description}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#999', fontStyle: 'italic' }}>
              Описание отсутствует
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-danger"
              style={{ flex: '1 1 auto', minWidth: '120px' }}
              onClick={deleteTask}
            >
              Удалить
            </button>
            <button 
              className="btn"
              style={{ flex: '1 1 auto', minWidth: '120px', border: '1px solid #667eea', background: 'white', color: '#667eea' }}
              onClick={() => navigate(`/tasks/${task.id}/edit`)}
            >
              Редактировать
            </button>
            <button 
              className="btn btn-primary"
              style={{ flex: '1 1 auto', minWidth: '120px' }}
              onClick={toggleStatus}
            >
              {task.status === 'completed' ? 'Возобновить' : 'Выполнить'}
            </button>
          </div>
        </div>
      </div>

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
        <button className="nav-item" onClick={() => navigate('/search')}>
          <div className="nav-icon">🔍</div>
          <div>Поиск</div>
        </button>
      </div>
    </div>
  );
}

export default TaskPageSimple;
