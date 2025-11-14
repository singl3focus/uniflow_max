import { useState, useEffect } from 'react';
import { Panel, Container, Grid, Typography, Flex } from '@maxhub/max-ui';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import type { Task } from '../types/api';

function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInboxTasks();
  }, []);

  const loadInboxTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await apiClient.getTasks();
      // Входящие - задачи без контекста или новые задачи
      const inboxTasks = allTasks.filter(task => !task.context_id);
      setTasks(inboxTasks);
    } catch (error) {
      console.error('Failed to load inbox tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column' }}>
      <Container style={{ flex: 1 }}>
        <Grid cols={1} gap={12}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Входящие</Typography.Title>
            <Typography.Action variant="small" color="tertiary">
              {tasks.length} {tasks.length === 1 ? 'задача' : tasks.length < 5 ? 'задачи' : 'задач'}
            </Typography.Action>
          </Flex>

          {loading ? (
            <Typography.Action>Загрузка...</Typography.Action>
          ) : tasks.length === 0 ? (
            <Card>
              <Flex direction="column" gap={12} align="center" style={{ padding: 40 }}>
                <Typography.Action variant="large" style={{ fontSize: '48px' }}>
                  📥
                </Typography.Action>
                <Typography.Title variant="small-strong">Нет новых задач</Typography.Title>
                <Typography.Action variant="small" color="secondary">
                  Все задачи обработаны или распределены по контекстам
                </Typography.Action>
              </Flex>
            </Card>
          ) : (
            <Grid cols={1} gap={12}>
              {tasks.map((task) => (
                <Card key={task.id} style={{ cursor: 'pointer' }}>
                  <Flex direction="column" gap={8}>
                    <Typography.Title variant="small-strong">
                      {task.title}
                    </Typography.Title>
                    {task.description && (
                      <Typography.Action variant="small" color="secondary">
                        {task.description}
                      </Typography.Action>
                    )}
                    <Flex direction="row" gap={8} align="center">
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: task.status === 'completed' ? '#10B981' : '#3B82F6',
                        }}
                      />
                      <Typography.Action variant="small" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                        {task.status === 'todo' && 'К выполнению'}
                        {task.status === 'in_progress' && 'В процессе'}
                        {task.status === 'completed' && 'Выполнено'}
                        {task.status === 'cancelled' && 'Отменено'}
                      </Typography.Action>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>
          )}
        </Grid>
      </Container>

      <BottomNav />
    </Panel>
  );
}

export default InboxPage;
