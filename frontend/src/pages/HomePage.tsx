import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const services = [
    {
      title: 'Расписание',
      description: 'Просмотр расписания занятий',
      icon: '📅',
      path: '/schedule',
    },
    {
      title: 'Управление расписанием',
      description: 'Создание и редактирование расписания',
      icon: '✏️',
      path: '/schedule/manage',
    },
    {
      title: 'Группы',
      description: 'Управление группами',
      icon: '👥',
      path: '/groups',
    },
    {
      title: 'Преподаватели',
      description: 'Управление преподавателями',
      icon: '👨‍🏫',
      path: '/teachers',
    },
    {
      title: 'Предметы',
      description: 'Управление предметами',
      icon: '📚',
      path: '/subjects',
    },
    {
      title: 'Документы',
      description: 'Заказ справок и документов',
      icon: '📄',
      path: '/documents',
    },
    {
      title: 'Общежитие',
      description: 'Сервисы общежития',
      icon: '🏠',
      path: '/dormitory',
    },
    {
      title: 'Библиотека',
      description: 'Заказ книг и доступ к ресурсам',
      icon: '📖',
      path: '/library',
    },
    {
      title: 'Деканат',
      description: 'Запись на прием и заявления',
      icon: '🏛️',
      path: '/deanery',
    },
    {
      title: 'Финансы',
      description: 'Оплата и стипендии',
      icon: '💰',
      path: '/financial',
    },
  ];

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <Container style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Grid gap={24} cols={1} style={{ flex: 1 }}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Вузуслуги</Typography.Title>
            <Button mode="secondary" onClick={logout}>
              Выйти
            </Button>
          </Flex>

          <Typography.Action color="secondary" variant="large">
            Выберите сервис
          </Typography.Action>

          <Grid gap={16} cols={1} style={{ flex: 1 }}>
            {services.map((service) => (
              <Card key={service.path} onClick={() => navigate(service.path)} style={{ cursor: 'pointer' }}>
                <Flex direction="row" align="center" gap={16}>
                  <Typography.Action variant="large">{service.icon}</Typography.Action>
                  <Flex direction="column" gap={4} style={{ flex: 1 }}>
                    <Typography.Title variant="small-strong">{service.title}</Typography.Title>
                    <Typography.Action variant="small">
                      {service.description}
                    </Typography.Action>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Grid>
      </Container>

      <Grid gap={12} cols={4} style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--color-border-secondary)' }}>
        <Button mode="primary" style={{ width: '100%' }} onClick={() => navigate('/today')}>
          Сегодня
        </Button>
        <Button mode="primary" style={{ width: '100%' }}>
          Контексты
        </Button>
        <Button mode="primary" style={{ width: '100%' }}>
          Входящие
        </Button>
        <Button mode="primary" style={{ width: '100%' }}>
          Поиск
        </Button>
      </Grid>
    </Panel>
  );
}

export default HomePage;

