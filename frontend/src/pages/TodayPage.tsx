import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { triggerHaptic } from '../lib/maxBridge';
import type { Task, TaskStatus } from '../types/api';
import { format, parseISO, addDays, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function TodayPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // All tasks fetched from API (we derive sections from this)
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ overdue: boolean; today: boolean }>({ overdue: false, today: false });

  useEffect(() => {
    // reload all tasks when selected date changes (sections are derived from full list)
    if (isAuthenticated) {
      // Небольшая задержка чтобы убедиться, что токен готов
      const timer = setTimeout(() => {
        loadTasksForDate();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, isAuthenticated]);

  const loadTasksForDate = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    console.log('[TodayPage] loadTasksForDate called, token in localStorage:', !!token);
    try {
      const fetched = await apiClient.getTasks();
      // keep the full list — sections (overdue/today) are derived from this
      setAllTasks(fetched);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      // Если 401 (Unauthorized), перенаправляем на логин
      if (error.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const toggleTaskStatus = async (taskId: number, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    
    // Trigger haptic feedback
    if (newStatus === 'completed') {
      triggerHaptic('success');
    } else {
      triggerHaptic('impact');
    }

    try {
      await apiClient.updateTask(taskId, { status: newStatus } as any);
      // Reload tasks
      await loadTasksForDate();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const formatTime = (dateTime: string) => {
    try {
      return format(parseISO(dateTime), 'HH:mm', { locale: ru });
    } catch {
      return dateTime;
    }
  };

  // derive today's tasks and overdue tasks from the full list
  const todayTasks = allTasks.filter((task) => {
    if (!task.due_at) return false;
    const taskDateTime = parseISO(task.due_at);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    return isWithinInterval(taskDateTime, { start: dayStart, end: dayEnd });
  });

  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const totalCount = todayTasks.length;

  // Overdue: tasks with due_at before the start of today (and not completed)
  const overdueTasks = allTasks.filter((task) => {
    if (!task.due_at) return false;
    const taskDateTime = parseISO(task.due_at);
    const todayStart = startOfDay(new Date());
    return taskDateTime < todayStart && task.status !== 'completed';
  });

  const toggleSection = (section: 'overdue' | 'today') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderTaskCard = (task: Task) => {
    const statusColors: Record<string, { border: string; bg: string }> = {
      todo: { border: '#3B82F6', bg: '#EFF6FF' },
      in_progress: { border: '#F59E0B', bg: '#FFFBEB' },
      completed: { border: '#10B981', bg: '#F0FDF4' },
      cancelled: { border: '#EF4444', bg: '#FEF2F2' },
    };
    const colors = statusColors[task.status] || statusColors.todo;

    return (
      <Card
        key={task.id}
        style={{
          // use a solid, non-transparent card background (dark-theme friendly)
          // fallback uses a dark surface color; you can override by defining --card-bg in your global CSS
          background: 'var(--card-bg, #0f1724)',
          borderLeft: `4px solid ${colors.border}`,
          borderRadius: '8px',
          transition: 'all 200ms ease',
          opacity: task.status === 'completed' ? 0.85 : 1,
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.03)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset',
          width: '100%',
          display: 'block',
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        <Flex direction="column" gap={10}>
          <Flex direction="row" justify="space-between" align="flex-start">
            <Flex direction="row" gap={12} align="flex-start" style={{ flex: 1 }}>
              <div style={{ marginTop: '2px' }}>
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={(e) => {
                    // prevent card click navigation when toggling checkbox
                    e.stopPropagation();
                    toggleTaskStatus(task.id, task.status);
                  }}
                  aria-label={`mark-${task.id}`}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: colors.border,
                  }}
                />
              </div>
              <Flex direction="column" gap={6} style={{ flex: 1 }}>
                <Typography.Title
                  variant="small-strong"
                  style={{
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    color: 'var(--card-text, #ffffff)',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  {task.title}
                </Typography.Title>
                {task.description && (
                  <Typography.Action
                    variant="small"
                    style={{
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: 'var(--card-text-secondary, rgba(255,255,255,0.85))',
                      lineHeight: '1.4',
                    }}
                  >
                    {task.description}
                  </Typography.Action>
                )}
              </Flex>
            </Flex>
            <Flex direction="column" gap={4} align="flex-end" style={{ marginLeft: '12px' }}>
              {task.due_at && (
                <Typography.Action
                  variant="small"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--card-text, #ffffff)',
                    // subtle pill suitable for dark theme as well
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  {formatTime(task.due_at)}
                </Typography.Action>
              )}
            </Flex>
          </Flex>

          <Flex direction="row" gap={8} align="center" justify="space-between">
            <Flex direction="row" gap={8} align="center">
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colors.border,
                }}
              />
              <Typography.Action
                variant="small"
                style={{
                  fontSize: '12px',
                  color: 'var(--card-text-secondary, rgba(255,255,255,0.85))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 500,
                }}
              >
                {task.status === 'todo' && 'К выполнению'}
                {task.status === 'in_progress' && 'В процессе'}
                {task.status === 'completed' && 'Выполнено'}
                {task.status === 'cancelled' && 'Отменено'}
              </Typography.Action>
            </Flex>
            {task.context_id && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--card-text, #ffffff)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                Контекст #{task.context_id}
              </div>
            )}
          </Flex>
        </Flex>
      </Card>
    );
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <Container style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Grid gap={0} cols={1} style={{ flex: 1 }}>
          <Flex direction="row" justify="space-between" align="center" gap={12} style={{ width: '100%', marginBottom: 2 }}>
            <div style={{ minWidth: 44, display: 'flex', justifyContent: 'flex-start' }}>
              <Button mode="secondary" onClick={handlePreviousDay} style={{ padding: '8px 12px' }} aria-label="previous-day">
                ←
              </Button>
            </div>

            <Flex direction="column" align="center" gap={4} style={{}}>
              <Typography.Action variant="small" color="tertiary" style={{ textAlign: 'center' }}>
                {format(selectedDate, 'd MMMM, EEEE', { locale: ru })}
              </Typography.Action>
            </Flex>

            <div style={{ minWidth: 44, display: 'flex', justifyContent: 'flex-end' }}>
              <Button mode="secondary" onClick={handleNextDay} style={{ padding: '8px 12px' }} aria-label="next-day">
                →
              </Button>
            </div>
          </Flex>

          {/* Status bar for completed tasks */}
          <Flex direction="column" gap={0} style={{ marginTop: 0, marginBottom: 2 }}>
            <Typography.Action variant="small" color="tertiary" style={{ marginBottom: 2 }}>
              Выполнено {completedCount} из {totalCount} задач
            </Typography.Action>
            <div style={{ height: 12, background: 'var(--status-bar-bg, #ffffff)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div
                style={{
                  width: `${totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)}%`,
                  height: '100%',
                  background: 'var(--color-success, #10B981)',
                  transition: 'width 200ms ease',
                  borderRadius: 8,
                }}
              />
            </div>
          </Flex>

          {loading ? (
            <Typography.Action>Загрузка...</Typography.Action>
          ) : todayTasks.length === 0 && overdueTasks.length === 0 ? (
            <Card>
              <Flex direction="column" gap={12} align="center" justify="center" style={{ padding: '40px 20px' }}>
                <Typography.Action variant="large">✓</Typography.Action>
                <Typography.Title variant="small-strong">Нет задач на этот день</Typography.Title>
                <Typography.Action variant="small" color="secondary">
                  У вас нет запланированных задач на этот день
                </Typography.Action>
              </Flex>
            </Card>
          ) : (
            <Grid gap={2} cols={1}>
              {/* Overdue Tasks Section */}
              {overdueTasks.length > 0 && (
                <Flex direction="column" gap={2}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSection('overdue')}
                    onKeyDown={(e) => {
                      // allow Enter and Space to toggle
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSection('overdue');
                      }
                    }}
                    aria-expanded={expandedSections.overdue}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      // Overdue section styling - using accent red from palette
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '2px solid #EF4444',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      outline: 'none',
                      userSelect: 'none',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Flex direction="row" gap={8} align="center">
                      <span style={{ fontSize: '18px' }}>🔴</span>
                      <Typography.Title variant="small-strong" style={{ color: '#991B1B' }}>
                        Просроченные ({overdueTasks.length})
                      </Typography.Title>
                    </Flex>
                    <span
                      style={{
                        fontSize: '14px',
                        display: 'inline-block',
                        transform: expandedSections.overdue ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 180ms ease',
                      }}
                    >
                      ▶
                    </span>
                  </div>

                  {expandedSections.overdue && (
                    <Grid gap={2} cols={1} style={{ width: '100%' }}>
                      {overdueTasks.map((task) => renderTaskCard(task))}
                    </Grid>
                  )}
                </Flex>
              )}

              {/* Today Tasks Section */}
              {todayTasks.length > 0 && (
                <Flex direction="column" gap={2} style={{ marginTop: overdueTasks.length > 0 ? 8 : 0 }}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSection('today')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSection('today');
                      }
                    }}
                    aria-expanded={expandedSections.today}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      // Today section styling - using blue accent from palette
                      background: 'rgba(3, 105, 161, 0.08)',
                      border: '2px solid #0369A1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      outline: 'none',
                      userSelect: 'none',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Flex direction="row" gap={8} align="center">
                      <span style={{ fontSize: '18px' }}>📋</span>
                      <Typography.Title variant="small-strong" style={{ color: '#1E40AF' }}>
                        Текущие задачи ({todayTasks.length})
                      </Typography.Title>
                    </Flex>
                    <span
                      style={{
                        fontSize: '14px',
                        display: 'inline-block',
                        transform: expandedSections.today ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 180ms ease',
                      }}
                    >
                      ▶
                    </span>
                  </div>

                  {expandedSections.today && (
                    <Grid gap={2} cols={1} style={{ width: '100%' }}>
                      {todayTasks.map((task) => renderTaskCard(task))}
                    </Grid>
                  )}
                </Flex>
              )}
            </Grid>
          )}
        </Grid>
      </Container>

      <BottomNav />
    </Panel>
  );
}

export default TodayPage;
