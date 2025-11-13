import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Typography, Flex, Button } from '@maxhub/max-ui';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import type { Context } from '../types/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function ContextPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [context, setContext] = useState<Context | null>(null);

  useEffect(() => {
    loadContext();
  }, [id]);

  const loadContext = async () => {
    // load from localStorage first
    const raw = localStorage.getItem('mock_contexts_v1');
    let list: Context[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw) as Context[];
      } catch (e) {
        // ignore
      }
    }

    if (list.length > 0) {
      const found = list.find((c) => String(c.id) === String(id));
      if (found) return setContext(found);
    }

    // fallback to apiClient
    try {
      const all = await apiClient.getContexts();
      const found = all.find((c) => String(c.id) === String(id));
      if (found) setContext(found);
    } catch (err) {
      console.error('Failed to load context', err);
    }
  };

  if (!context) {
    return (
      <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20 }}>
        <Container>
          <Typography.Action>Загрузка...</Typography.Action>
        </Container>
      </Panel>
    );
  }

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column' }}>
      <Container style={{ flex: 1 }}>
        <Grid cols={1} gap={12}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">{context.title}</Typography.Title>
            <Button mode="secondary" onClick={() => navigate('/contexts')}>Назад</Button>
          </Flex>

          <Card style={{ background: 'var(--card-bg, #0f1724)', padding: 20 }}>
            <Flex direction="column" gap={12}>
              <Typography.Action style={{ color: 'var(--card-text, #fff)' }}>{context.description}</Typography.Action>
              <Flex direction="row" gap={8} align="center">
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: context.color }} />
                <Typography.Action style={{ color: 'var(--card-text-secondary, rgba(255,255,255,0.85))' }}>{context.type}</Typography.Action>
                {context.deadline_at && (
                  <Typography.Action style={{ marginLeft: 8 }}>{format(parseISO(context.deadline_at), 'd MMMM yyyy', { locale: ru })}</Typography.Action>
                )}
              </Flex>
            </Flex>
          </Card>
        </Grid>
      </Container>
    </Panel>
  );
}

export default ContextPage;
