import { useLocation, useNavigate } from 'react-router-dom';
import { Grid, Button } from '@maxhub/max-ui';
export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeStyle = (path: string) => (pathname === path ? { boxShadow: 'inset 0 -3px 0 var(--color-border-primary, #0369A1)' } : {});

  return (
    <Grid gap={12} cols={4} style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--color-border-secondary)' }}>
      <Button mode="primary" style={{ width: '100%', ...(activeStyle('/')) }} onClick={() => navigate('/')}>Сегодня</Button>
      <Button mode="primary" style={{ width: '100%', ...(activeStyle('/contexts')) }} onClick={() => navigate('/contexts')}>Контексты</Button>
      <Button mode="primary" style={{ width: '100%', ...(activeStyle('/inbox')) }} onClick={() => navigate('/inbox')}>Входящие</Button>
      <Button mode="primary" style={{ width: '100%', ...(activeStyle('/search')) }} onClick={() => navigate('/search')}>Поиск</Button>
    </Grid>
  );
}
