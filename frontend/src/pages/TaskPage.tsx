import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import type { Task, TaskStatus } from '../types/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function TaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTask(Number(id));
  }, [id]);

  const loadTask = async (taskId: number) => {
    setLoading(true);
    try {
      const all = await apiClient.getTasks();
      let found = all.find((t) => t.id === taskId) || null;
      // apply any local mock overrides stored in localStorage
      try {
        const key = 'mock_task_overrides_v1';
        const raw = localStorage.getItem(key);
        const map = raw ? JSON.parse(raw) : {};
        if (map && map[String(taskId)]) {
          found = { ...found, ...map[String(taskId)] } as Task;
        }
      } catch (e) {
        // ignore localStorage parse errors
      }
      setTask(found);
    } catch (err) {
      console.error('Failed loading task', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (taskId: number, current: TaskStatus) => {
    // For now we mock the update locally (no network request).
    const next: TaskStatus = current === 'completed' ? 'todo' : 'completed';
    try {
      if (!task) return;
      const updated: Task = {
        ...task,
        status: next,
        completed_at: next === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      setTask(updated);

      // persist mock updates in localStorage so the change survives reloads during development
      try {
        const key = 'mock_task_overrides_v1';
        const raw = localStorage.getItem(key);
        const map = raw ? JSON.parse(raw) : {};
        map[String(taskId)] = updated;
        localStorage.setItem(key, JSON.stringify(map));
      } catch (e) {
        // ignore localStorage errors
      }
    } catch (err) {
      console.error('Failed updating mock task', err);
    }
  };

  if (loading) {
    return (
      <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20 }}>
        <Container>
          <Typography.Action>Загрузка...</Typography.Action>
        </Container>
      </Panel>
    );
  }

  if (!task) {
    return (
      <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20 }}>
        <Container>
          <Card>
            <Flex direction="column" gap={12} align="center" style={{ padding: 40 }}>
              <Typography.Title variant="small-strong">Задача не найдена</Typography.Title>
              <Button mode="secondary" onClick={() => navigate(-1)}>
                Назад
              </Button>
            </Flex>
          </Card>
        </Container>
      </Panel>
    );
  }

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column' }}>
      <Container style={{ flex: 1 }}>
        <Grid cols={1} gap={20}>
          <Button mode="secondary" onClick={() => navigate(-1)} style={{ width: 120 }}>
            ← Назад
          </Button>

          <Card style={{ padding: 20, background: 'var(--card-bg, #0f1724)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <Flex direction="column" gap={12}>
              <Flex direction="row" justify="space-between" align="center">
                <Typography.Title variant="large-strong" style={{ color: 'var(--card-text, #ffffff)' }}>
                  {task.title}
                </Typography.Title>
                <div>
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => toggleStatus(task.id, task.status)}
                    aria-label="toggle-task"
                    style={{ width: 20, height: 20 }}
                  />
                </div>
              </Flex>

              {task.description && (
                <Typography.Action style={{ color: 'var(--card-text-secondary, rgba(255,255,255,0.9))' }}>
                  {task.description}
                </Typography.Action>
              )}

              <Flex direction="row" gap={12} style={{ marginTop: 8 }}>
                {task.due_at && (
                  <div style={{ fontSize: 14, color: 'var(--card-text, #fff)' }}>
                    Дедлайн: {format(parseISO(task.due_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </div>
                )}
                {task.context_id && (
                  <div style={{ fontSize: 14, color: 'var(--card-text, #fff)' }}>Контекст # {task.context_id}</div>
                )}
              </Flex>
            </Flex>
          </Card>
        </Grid>
      </Container>
    </Panel>
  );
}

export default TaskPage;
