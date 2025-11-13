import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Card from '../components/Card';

function FinancialPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'payment' | 'scholarship'>('payment');
  const [paymentAmount, setPaymentAmount] = useState('');

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Финансы</Typography.Title>
            <Button mode="secondary" onClick={() => navigate('/')}>
              Назад
            </Button>
          </Flex>

          <Flex gap={8}>
            <Button
              mode={activeTab === 'payment' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('payment')}
            >
              Оплата обучения
            </Button>
            <Button
              mode={activeTab === 'scholarship' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('scholarship')}
            >
              Стипендии
            </Button>
          </Flex>

          {activeTab === 'payment' && (
            <Card>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Оплата обучения</Typography.Title>
                <Typography.Action>
                  <strong>Текущий баланс:</strong> 0 ₽
                </Typography.Action>
                <Typography.Action>
                  <strong>Задолженность:</strong> 0 ₽
                </Typography.Action>
                <Input
                  label="Сумма оплаты"
                  type="number"
                  placeholder="Введите сумму"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <Button mode="primary">Оплатить</Button>
              </Grid>
            </Card>
          )}

          {activeTab === 'scholarship' && (
            <Card>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Информация о стипендиях</Typography.Title>
                <Typography.Action>
                  <strong>Текущая стипендия:</strong> 0 ₽
                </Typography.Action>
                <Typography.Action>
                  <strong>Статус:</strong> Не назначена
                </Typography.Action>
                <Typography.Action color="secondary">
                  Для получения информации о стипендиях обратитесь в деканат
                </Typography.Action>
              </Grid>
            </Card>
          )}
        </Grid>
      </Container>
    </Panel>
  );
}

export default FinancialPage;

