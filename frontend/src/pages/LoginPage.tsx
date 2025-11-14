import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [maxId, setMaxId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { loginWithMaxId, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Переходим на страницу сегодня когда успешно залогинились
  useEffect(() => {
    if (loginSuccess && isAuthenticated) {
      console.log('[LoginPage] Authentication successful, navigating to /today');
      // Задержка чтобы убедиться, что все состояния обновились
      const timer = setTimeout(() => {
        navigate('/today', { replace: true });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, isAuthenticated, navigate]);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithMaxId(maxId);
      setLoginSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Ошибка входа. Проверьте MAX ID.');
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="column" align="center" gap={16}>
            <Typography.Title variant="large-strong">Вузуслуги</Typography.Title>
            <Typography.Action color="secondary">
              Войдите в систему для доступа к сервисам
            </Typography.Action>
          </Flex>

          <form onSubmit={handleSubmit}>
            <Grid gap={16} cols={1}>
              <div>
                <Input
                  label="MAX ID"
                  labelColor="#ffffff"
                  placeholder="Введите MAX ID"
                  value={maxId}
                  onChange={(e) => setMaxId(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <Typography.Action color="danger" variant="small">
                  {error}
                </Typography.Action>
              )}

              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </Grid>
          </form>
        </Grid>
      </Container>
    </Panel>
  );
}

export default LoginPage;

