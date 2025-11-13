import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Modal from '../components/Modal';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import { triggerHaptic } from '../lib/maxBridge';
import type { Context } from '../types/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function ContextsPage() {
  const navigate = useNavigate();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#7C3AED');
  const [newType, setNewType] = useState<Context['type']>('project');
  const [newDeadline, setNewDeadline] = useState<string | null>(null);

  useEffect(() => {
    loadContexts();
  }, []);

  const loadContexts = async () => {
    setLoading(true);
    try {
      // Prefer local mock in localStorage so created contexts persist
      const raw = localStorage.getItem('mock_contexts_v1');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Context[];
          setContexts(parsed);
          return;
        } catch (e) {
          console.warn('Failed parsing local contexts', e);
        }
      }

      const data = await apiClient.getContexts();
      setContexts(data);
    } catch (err) {
      console.error('Failed loading contexts', err);
    } finally {
      setLoading(false);
    }
  };

  const persistContexts = (list: Context[]) => {
    try {
      localStorage.setItem('mock_contexts_v1', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist contexts', e);
    }
  };

  const handleCreate = () => {
    triggerHaptic('impact');
    const now = new Date().toISOString();
    const id = Date.now();
    const ctx: Context = {
      id,
      user_id: 1,
      type: newType,
      title: newTitle || 'Без названия',
      description: newDescription || '',
      subject_id: null,
      color: newColor,
      deadline_at: newDeadline || null,
      created_at: now,
      updated_at: now,
    };

    const updated = [ctx, ...contexts];
    setContexts(updated);
    persistContexts(updated);
    setCreateOpen(false);
    setNewTitle('');
    setNewDescription('');
    triggerHaptic('success');
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column' }}>
      <Container style={{ flex: 1 }}>
        <Grid cols={1} gap={12}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Контексты</Typography.Title>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Поиск" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border-secondary)', background: 'var(--card-bg, #0f1724)', color: 'var(--card-text, #fff)' }} />
              <Button mode="primary" onClick={() => setCreateOpen(true)}>Создать контекст</Button>
            </div>
          </Flex>

          {loading ? (
            <Typography.Action>Загрузка...</Typography.Action>
          ) : contexts.length === 0 ? (
            <Card>
              <Flex direction="column" gap={12} align="center" style={{ padding: 40 }}>
                <Typography.Title variant="small-strong">Нет контекстов</Typography.Title>
                <Typography.Action variant="small">Создайте новый контекст, чтобы начать работу</Typography.Action>
              </Flex>
            </Card>
          ) : (
            <Grid cols={1} gap={12}>
              {contexts
                .filter((c) => {
                  if (!filter) return true;
                  const q = filter.toLowerCase();
                  return c.title.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
                })
                .map((c) => (
                <Card
                  key={c.id}
                  style={{
                    background: 'var(--card-bg, #0f1724)',
                    borderLeft: `4px solid ${c.color || '#ccc'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset',
                    width: '100%',
                    display: 'block',
                    boxSizing: 'border-box',
                    transition: 'all 200ms ease',
                  }}
                  onClick={() => navigate(`/contexts/${c.id}`)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.02) inset';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  <Flex direction="column" gap={10}>
                    <Flex direction="row" justify="space-between" align="flex-start">
                      <Flex direction="column" gap={6} style={{ flex: 1 }}>
                        <Typography.Title
                          variant="small-strong"
                          style={{
                            color: 'var(--card-text, #ffffff)',
                            fontSize: '15px',
                            fontWeight: 600,
                          }}
                        >
                          {c.title}
                        </Typography.Title>
                        {c.description && (
                          <Typography.Action
                            variant="small"
                            style={{
                              color: 'var(--card-text-secondary, rgba(255,255,255,0.85))',
                              lineHeight: '1.4',
                            }}
                          >
                            {c.description}
                          </Typography.Action>
                        )}
                      </Flex>
                      {c.deadline_at && (
                        <div style={{ marginLeft: 12 }}>
                          <Typography.Action
                            variant="small"
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--card-text, #ffffff)',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            {format(parseISO(c.deadline_at), 'd MMM', { locale: ru })}
                          </Typography.Action>
                        </div>
                      )}
                    </Flex>

                    <Flex direction="row" gap={8} align="center" justify="space-between">
                      <Flex direction="row" gap={8} align="center">
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: c.color || '#ccc',
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
                          {c.type === 'subject' && 'Учебный предмет'}
                          {c.type === 'project' && 'Проект'}
                          {c.type === 'personal' && 'Личное'}
                          {c.type === 'work' && 'Работа'}
                          {c.type === 'other' && 'Другое'}
                        </Typography.Action>
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>
          )}
        </Grid>
      </Container>

      <BottomNav />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Typography.Title variant="small-strong">Создать контекст</Typography.Title>
          <input placeholder="Название" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--color-border-secondary)' }} />
          <textarea placeholder="Описание" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--color-border-secondary)', minHeight: 80 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Тип
              <select value={newType} onChange={(e) => setNewType(e.target.value as Context['type'])} style={{ padding: 6 }}>
                <option value="subject">Учебный предмет</option>
                <option value="project">Проект</option>
                <option value="personal">Личное</option>
                <option value="work">Работа</option>
                <option value="other">Другое</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Цвет
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Дедлайн
              <input type="date" onChange={(e) => setNewDeadline(e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button mode="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button mode="primary" onClick={handleCreate}>Создать</Button>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}

export default ContextsPage;
