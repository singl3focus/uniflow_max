import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';

function LibraryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'order' | 'electronic'>('order');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Библиотека</Typography.Title>
            <Button mode="secondary" onClick={() => navigate('/')}>
              Назад
            </Button>
          </Flex>

          <Flex gap={8}>
            <Button
              mode={activeTab === 'order' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('order')}
            >
              Заказ книг
            </Button>
            <Button
              mode={activeTab === 'electronic' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('electronic')}
            >
              Электронные ресурсы
            </Button>
          </Flex>

          {activeTab === 'order' && (
            <Grid gap={16} cols={1}>
              <Card>
                <Grid gap={16} cols={1}>
                  <Typography.Title variant="medium-strong">Заказ книги</Typography.Title>
                  <Button mode="primary" onClick={() => setIsModalOpen(true)}>
                    Заказать книгу
                  </Button>
                </Grid>
              </Card>
            </Grid>
          )}

          {activeTab === 'electronic' && (
            <Card>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Электронные библиотечные ресурсы</Typography.Title>
                <Typography.Action color="secondary">
                  Доступ к электронным ресурсам библиотеки
                </Typography.Action>
                <Button mode="primary">Открыть каталог</Button>
              </Grid>
            </Card>
          )}

          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Заявка на книгу отправлена');
                setIsModalOpen(false);
                setBookTitle('');
                setBookAuthor('');
              }}
            >
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">Заказ книги</Typography.Title>

                <Input
                  label="Название книги"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                />

                <Input
                  label="Автор"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
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

export default LibraryPage;

