import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from '../contexts/AppStateContext';
import { useToast } from '../contexts/ToastContext';
import type { Task } from '../types/api';
import { TaskCard } from '../components/TaskCard';
import { format, parseISO, addDays, isBefore, isWithinInterval, startOfDay, endOfDay, startOfToday } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function TodayPageSimple() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { tasks: allTasks, refreshTasks } = useAppState();
  const { showError, showSuccess } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ overdue: boolean; today: boolean }>({ overdue: true, today: true });
  const loadedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !loadedRef.current) {
      loadedRef.current = true;
      loadTasksForDate();
    }
  }, [isAuthenticated]);

  const loadTasksForDate = async () => {
    setLoading(true);
    try {
      await refreshTasks();
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      showError('Не удалось загрузить задачи');
      if (error.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  const formatDateHeader = (date: Date) => {
    const dayName = format(date, 'EEEE', { locale: ru });
    const dayNum = format(date, 'd MMM', { locale: ru });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNum}`;
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `Неделя ${weekNumber}`;
  };

  const todayStart = startOfDay(selectedDate);
  const todayEnd = endOfDay(selectedDate);
  const nowStart = startOfToday();

  const overdueTasks = allTasks.filter(task => {
    if (!task.due_at || task.status === 'completed') return false;
    const dueDate = parseISO(task.due_at);
    return isBefore(dueDate, nowStart);
  });

  const todayTasks = allTasks.filter(task => {
    if (!task.due_at) return false;
    const dueDate = parseISO(task.due_at);
    return isWithinInterval(dueDate, { start: todayStart, end: todayEnd });
  });

  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const progressPercent = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

  const toggleSection = (section: 'overdue' | 'today') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getContextColor = (contextId: string | null) => {
    // Простая генерация цвета на основе ID или дефолтный
    const colors = ['#667eea', '#f093fb', '#f44336', '#4CAF50', '#ff9800', '#9c27b0', '#009688'];
    if (!contextId) return '#4CAF50';
    const index = parseInt(contextId.split('-')[0], 36) % colors.length;
    return colors[index];
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    console.log('[TodayPage] Toggling task status:', { taskId, currentStatus, newStatus });
    try {
      await apiClient.updateTaskStatus(taskId, newStatus);
      console.log('[TodayPage] Task status updated, reloading tasks');
      await refreshTasks();
      showSuccess('Статус задачи обновлен');
    } catch (error: any) {
      console.error('[TodayPage] Failed to update task:', error);
      showError('Не удалось обновить статус');
    }
  };

  const TaskItem = ({ task, isOverdue = false }: { task: Task; isOverdue?: boolean }) => (
    <TaskCard
      task={task}
      onToggle={toggleTaskStatus}
      onClick={() => navigate(`/tasks/${task.id}`)}
      isOverdue={isOverdue}
      contextColor={getContextColor(task.context_id || null)}
    />
  );

  return (
    <div style={{ paddingBottom: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <h1>Расписание</h1>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <button 
            onClick={() => changeDate(-1)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              padding: '0',
              lineHeight: '1'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ←
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>{formatDateHeader(selectedDate)}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, color: 'white' }}>{getWeekNumber(selectedDate)}</div>
          </div>
          
          <button 
            onClick={() => changeDate(1)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              padding: '0',
              lineHeight: '1'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-container">
        <div className="progress-header">
          <div className="progress-title">Прогресс дня</div>
          <div className="progress-percent">{completedToday}/{todayTasks.length} задач</div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="section">
          <div className="section-header" onClick={() => toggleSection('overdue')}>
            <div className="section-title" style={{ color: '#f44336' }}>
              Просроченные
              <span className="section-count">{overdueTasks.length} задач</span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              transition: 'transform 0.3s ease', 
              transform: expandedSections.overdue ? 'rotate(0deg)' : 'rotate(-90deg)' 
            }}>
              ▼
            </div>
          </div>
          {expandedSections.overdue && (
            <div>
              {overdueTasks.map(task => <TaskItem key={task.id} task={task} isOverdue />)}
            </div>
          )}
        </div>
      )}

      {/* Today tasks */}
      <div className="section">
        <div className="section-header" onClick={() => toggleSection('today')}>
          <div className="section-title">
            Задачи на день
            <span className="section-count">{todayTasks.length} задач</span>
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            transition: 'transform 0.3s ease', 
            transform: expandedSections.today ? 'rotate(0deg)' : 'rotate(-90deg)' 
          }}>
            ▼
          </div>
        </div>
        {expandedSections.today && (
          <div>
            {loading ? (
              <div className="empty-state">Загрузка...</div>
            ) : todayTasks.length === 0 ? (
              <div className="empty-state">Нет задач на этот день 📝</div>
            ) : (
              todayTasks.map(task => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>

      {/* Add button */}
      <button className="add-task-btn" onClick={() => navigate('/tasks/new')}>
        +
      </button>

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

export default TodayPageSimple;
