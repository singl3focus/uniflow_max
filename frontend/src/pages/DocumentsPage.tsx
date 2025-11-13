import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Select from '../components/Select';

function DocumentsPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [requests, setRequests] = useState<Array<{ id: number; type: string; purpose: string; status: string; date: string }>>([]);

  const documentTypes = [
    'Справка об обучении',
    'Справка для военкомата',
    'Справка о доходах',
    'Справка для визы',
    'Другое',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest = {
      id: Date.now(),
      type: documentType,
      purpose,
      status: 'В обработке',
      date: new Date().toLocaleDateString('ru-RU'),
    };
    setRequests([...requests, newRequest]);
    setIsModalOpen(false);
    setDocumentType('');
    setPurpose('');
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Заказ документов</Typography.Title>
            <Flex gap={8}>
              <Button mode="primary" onClick={() => setIsModalOpen(true)}>
                Заказать документ
              </Button>
              <Button mode="secondary" onClick={() => navigate('/')}>
                Назад
              </Button>
            </Flex>
          </Flex>

          <Typography.Action color="secondary">
            Закажите необходимые справки и документы прямо из приложения
          </Typography.Action>

          {requests.length === 0 ? (
            <Typography.Action color="secondary">Нет заявок</Typography.Action>
          ) : (
            <Grid gap={12} cols={1}>
              {requests.map((request) => (
                <Card key={request.id}>
                  <Grid gap={8} cols={1}>
                    <Typography.Title variant="small-strong">{request.type}</Typography.Title>
                    <Typography.Action>
                      <strong>Назначение:</strong> {request.purpose}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Статус:</strong> {request.status}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Дата заявки:</strong> {request.date}
                    </Typography.Action>
                  </Grid>
                </Card>
              ))}
            </Grid>
          )}

          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleSubmit}>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Заказ документа</Typography.Title>

                <Select
                  label="Тип документа"
                  required
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="">Выберите тип документа</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Назначение документа"
                  placeholder="Для чего нужен документ"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
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

export default DocumentsPage;

