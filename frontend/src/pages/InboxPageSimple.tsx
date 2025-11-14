import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../api/client';
import type { Task } from '../types/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function InboxPageSimple() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await apiClient.getTasks();
      console.log('[InboxPage] All tasks:', allTasks);
      // Фильтруем задачи без контекста
      const unassignedTasks = allTasks.filter(task => !task.context_id);
      console.log('[InboxPage] Unassigned tasks:', unassignedTasks);
      setTasks(unassignedTasks);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    console.log('[InboxPage] Toggling task status:', { taskId, currentStatus, newStatus });
    try {
      await apiClient.updateTaskStatus(taskId, newStatus);
      console.log('[InboxPage] Task status updated, reloading tasks');
      loadTasks();
    } catch (error) {
      console.error('[InboxPage] Failed to update task:', error);
    }
  };

  return (
    <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <h1>Входящие</h1>
        </div>
      </div>

      {/* Unassigned tasks */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            Непривязанные задачи
            <span className="section-count">{tasks.length} задач</span>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">Загрузка...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📥</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#333' }}>
              Все задачи привязаны
            </div>
            <div>У вас нет непривязанных задач</div>
          </div>
        ) : (
          <div>
            {tasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-checkbox">
                  <input 
                    type="checkbox" 
                    checked={task.status === 'completed'}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleTaskStatus(task.id, task.status);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="task-content" onClick={() => navigate(`/tasks/${task.id}`)}>
                  <div className="task-header">
                    <div className="task-color-indicator" style={{ background: '#4CAF50' }}></div>
                    <div className={`task-text ${task.status === 'completed' ? 'completed' : ''}`}>
                      {task.title}
                    </div>
                  </div>
                  <div className="task-meta">
                    {task.description && <span>{task.description}</span>}
                    {task.due_at && (
                      <span className="task-due">{format(parseISO(task.due_at), 'd MMM, HH:mm', { locale: ru })}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <button className="nav-item active" onClick={() => navigate('/inbox')}>
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

export default InboxPageSimple;
