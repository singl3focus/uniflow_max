import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import type { Subject, SubjectBase } from '../types/api';

function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectBase>({ name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await apiClient.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({ name: subject.name });
    } else {
      setEditingSubject(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    setFormData({ name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSubject) {
        await apiClient.updateSubject(editingSubject.id, formData);
      } else {
        await apiClient.createSubject(formData);
      }
      handleCloseModal();
      loadSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Ошибка при сохранении предмета');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот предмет?')) return;

    try {
      await apiClient.deleteSubject(subjectId);
      loadSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Ошибка при удалении предмета');
    }
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Предметы</Typography.Title>
            <Flex gap={8}>
              <Button mode="primary" onClick={() => handleOpenModal()}>
                Создать предмет
              </Button>
              <Button mode="secondary" onClick={() => navigate('/')}>
                Назад
              </Button>
            </Flex>
          </Flex>

          <Grid gap={12} cols={1}>
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <Flex direction="row" justify="space-between" align="center">
                  <Typography.Title variant="small-strong">{subject.name}</Typography.Title>
                  <Flex gap={8}>
                    <Button mode="secondary" size="small" onClick={() => handleOpenModal(subject)}>
                      Редактировать
                    </Button>
                    <Button mode="tertiary" size="small" onClick={() => handleDelete(subject.id)}>
                      Удалить
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>

          <Modal open={isModalOpen} onClose={handleCloseModal}>
            <form onSubmit={handleSubmit}>
              <Grid gap={16} cols={1}>
                <Typography.Title variant="medium-strong">
                  {editingSubject ? 'Редактировать предмет' : 'Создать предмет'}
                </Typography.Title>

                <Input
                  label="Название предмета"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <Flex gap={8}>
                  <Button type="submit" mode="primary" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button type="button" mode="secondary" onClick={handleCloseModal}>
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

export default SubjectsPage;

