import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Select from '../components/Select';

function DeaneryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'appointment' | 'application'>('appointment');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [applicationType, setApplicationType] = useState('');
  const [applicationReason, setApplicationReason] = useState('');

  const applicationTypes = [
    'Перевод на другую специальность',
    'Академический отпуск',
    'Материальная помощь',
    'Другое',
  ];

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Деканат</Typography.Title>
            <Button mode="secondary" onClick={() => navigate('/')}>
              Назад
            </Button>
          </Flex>

          <Flex gap={8}>
            <Button
              mode={activeTab === 'appointment' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('appointment')}
            >
              Запись на прием
            </Button>
            <Button
              mode={activeTab === 'application' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('application')}
            >
              Подача заявлений
            </Button>
          </Flex>

          {activeTab === 'appointment' && (
            <Card>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Запись на прием в деканат</Typography.Title>
                <Input
                  label="Дата"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
                <Input
                  label="Время"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
                <Button mode="primary" onClick={() => setIsModalOpen(true)}>
                  Записаться
                </Button>
              </Grid>
            </Card>
          )}

          {activeTab === 'application' && (
            <Card>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Подача заявления</Typography.Title>
                <Select
                  label="Тип заявления"
                  value={applicationType}
                  onChange={(e) => setApplicationType(e.target.value)}
                >
                  <option value="">Выберите тип заявления</option>
                  {applicationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Причина"
                  placeholder="Опишите причину"
                  multiline
                  rows={4}
                  value={applicationReason}
                  onChange={(e) => setApplicationReason(e.target.value)}
                />
                <Button mode="primary">Подать заявление</Button>
              </Grid>
            </Card>
          )}

          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <Grid gap={16} cols={1}>
              <Typography.Title variant="medium-strong">Подтверждение записи</Typography.Title>
              <Typography.Action>
                Вы записаны на {appointmentDate} в {appointmentTime}
              </Typography.Action>
              <Button mode="primary" onClick={() => setIsModalOpen(false)}>
                ОК
              </Button>
            </Grid>
          </Modal>
        </Grid>
      </Container>
    </Panel>
  );
}

export default DeaneryPage;

