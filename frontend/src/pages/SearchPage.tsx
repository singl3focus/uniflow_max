import { useState } from 'react';
import { Panel, Container, Grid, Typography, Flex, Button } from '@maxhub/max-ui';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Input from '../components/Input';
import { apiClient } from '../api/client';
import type { Task, Context } from '../types/api';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const [allTasks, allContexts] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getContexts(),
      ]);

      const q = query.toLowerCase();
      const filteredTasks = allTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q)
      );
      const filteredContexts = allContexts.filter(
        (ctx) =>
          ctx.title.toLowerCase().includes(q) ||
          ctx.description.toLowerCase().includes(q)
      );

      setTasks(filteredTasks);
      setContexts(filteredContexts);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalResults = tasks.length + contexts.length;

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column' }}>
      <Container style={{ flex: 1 }}>
        <Grid cols={1} gap={12}>
          <Typography.Title variant="large-strong">Поиск</Typography.Title>

          <Flex direction="row" gap={8}>
            <div style={{ flex: 1 }}>
              <Input
                label=""
                placeholder="Поиск задач и контекстов..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ width: '100%' }}
              />
            </div>
            <Button mode="primary" onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? 'Поиск...' : 'Найти'}
            </Button>
          </Flex>

          {searched && !loading && (
            <Typography.Action variant="small" color="tertiary">
              Найдено результатов: {totalResults}
            </Typography.Action>
          )}

          {loading ? (
            <Typography.Action>Загрузка...</Typography.Action>
          ) : !searched ? (
            <Card>
              <Flex direction="column" gap={12} align="center" style={{ padding: 40 }}>
                <Typography.Action variant="large" style={{ fontSize: '48px' }}>
                  🔍
                </Typography.Action>
                <Typography.Title variant="small-strong">Начните поиск</Typography.Title>
                <Typography.Action variant="small" color="secondary">
                  Введите запрос для поиска задач и контекстов
                </Typography.Action>
              </Flex>
            </Card>
          ) : totalResults === 0 ? (
            <Card>
              <Flex direction="column" gap={12} align="center" style={{ padding: 40 }}>
                <Typography.Action variant="large" style={{ fontSize: '48px' }}>
                  🤷
                </Typography.Action>
                <Typography.Title variant="small-strong">Ничего не найдено</Typography.Title>
                <Typography.Action variant="small" color="secondary">
                  Попробуйте изменить запрос
                </Typography.Action>
              </Flex>
            </Card>
          ) : (
            <Grid cols={1} gap={16}>
              {contexts.length > 0 && (
                <Flex direction="column" gap={8}>
                  <Typography.Title variant="small-strong" style={{ color: 'var(--card-text-secondary, rgba(255,255,255,0.85))' }}>
                    Контексты ({contexts.length})
                  </Typography.Title>
                  <Grid cols={1} gap={8}>
                    {contexts.map((ctx) => (
                      <Card key={ctx.id}>
                        <Flex direction="column" gap={8}>
                          <Flex direction="row" gap={8} align="center">
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: ctx.color || '#7C3AED',
                              }}
                            />
                            <Typography.Title variant="small-strong">
                              {ctx.title}
                            </Typography.Title>
                          </Flex>
                          {ctx.description && (
                            <Typography.Action variant="small" color="secondary">
                              {ctx.description}
                            </Typography.Action>
                          )}
                        </Flex>
                      </Card>
                    ))}
                  </Grid>
                </Flex>
              )}

              {tasks.length > 0 && (
                <Flex direction="column" gap={8}>
                  <Typography.Title variant="small-strong" style={{ color: 'var(--card-text-secondary, rgba(255,255,255,0.85))' }}>
                    Задачи ({tasks.length})
                  </Typography.Title>
                  <Grid cols={1} gap={8}>
                    {tasks.map((task) => (
                      <Card key={task.id}>
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

export default SearchPage;
