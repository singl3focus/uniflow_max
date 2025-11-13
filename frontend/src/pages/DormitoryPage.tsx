import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';

function DormitoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'payment' | 'guest' | 'support'>('payment');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestDate, setGuestDate] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Общежитие</Typography.Title>
            <Button mode="secondary" onClick={() => navigate('/')}>
              Назад
            </Button>
          </Flex>

          <Flex gap={8}>
            <Button
              mode={activeTab === 'payment' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('payment')}
            >
              Оплата
            </Button>
            <Button
              mode={activeTab === 'guest' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('guest')}
            >
              Пропуск для гостя
            </Button>
            <Button
              mode={activeTab === 'support' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('support')}
            >
              Техподдержка
            </Button>
          </Flex>

          {activeTab === 'payment' && (
            <Card>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Оплата проживания</Typography.Title>
                <Typography.Action>
                  <strong>Текущий баланс:</strong> 0 ₽
                </Typography.Action>
                <Typography.Action color="secondary">
                  Для оплаты проживания обратитесь в администрацию общежития
                </Typography.Action>
                <Button mode="primary">Оплатить</Button>
              </Grid>
            </Card>
          )}

          {activeTab === 'guest' && (
            <Grid gap={16} cols={1}>
              <Card>
                <Grid gap={16} cols={1}>
                  <Typography.Title variant="medium-strong">Заказ пропуска для гостя</Typography.Title>
                  <Button mode="primary" onClick={() => setIsModalOpen(true)}>
                    Заказать пропуск
                  </Button>
                </Grid>
              </Card>
            </Grid>
          )}

          {activeTab === 'support' && (
            <Card>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Техподдержка</Typography.Title>
                <Input
                  label="Сообщение"
                  placeholder="Опишите проблему"
                  multiline
                  rows={5}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                />
                <Button mode="primary">Отправить</Button>
              </Grid>
            </Card>
          )}

          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Заявка на пропуск отправлена');
                setIsModalOpen(false);
                setGuestName('');
                setGuestDate('');
              }}
            >
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Заказ пропуска для гостя</Typography.Title>

                <Input
                  label="ФИО гостя"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />

                <Input
                  label="Дата визита"
                  type="date"
                  required
                  value={guestDate}
                  onChange={(e) => setGuestDate(e.target.value)}
                />

                <Flex gap={8}>
                  <Button type="submit" mode="primary">
                    Отправить заявку
                  </Button>
                  <Button type="button" mode="secondary" onClick={() => setIsModalOpen(false)}>
                    Отмена
                  </Button>
                </Flex>
              </Grid>
            </form>
          </Modal>
        </Grid>
      </Container>
    </Panel>
  );
}

export default DormitoryPage;

