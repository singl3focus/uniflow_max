import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import type { Teacher, TeacherBase } from '../types/api';

function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<TeacherBase>({ full_name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const data = await apiClient.getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({ full_name: teacher.full_name });
    } else {
      setEditingTeacher(null);
      setFormData({ full_name: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
    setFormData({ full_name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTeacher) {
        await apiClient.updateTeacher(editingTeacher.id, formData);
      } else {
        await apiClient.createTeacher(formData);
      }
      handleCloseModal();
      loadTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Ошибка при сохранении преподавателя');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teacherId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого преподавателя?')) return;

    try {
      await apiClient.deleteTeacher(teacherId);
      loadTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Ошибка при удалении преподавателя');
    }
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Преподаватели</Typography.Title>
            <Flex gap={8}>
              <Button mode="primary" onClick={() => handleOpenModal()}>
                Создать преподавателя
              </Button>
              <Button mode="secondary" onClick={() => navigate('/')}>
                Назад
              </Button>
            </Flex>
          </Flex>

          <Grid gap={12} cols={1}>
            {teachers.map((teacher) => (
              <Card key={teacher.id}>
                <Flex direction="row" justify="space-between" align="center">
                  <Typography.Title variant="small-strong">{teacher.full_name}</Typography.Title>
                  <Flex gap={8}>
                    <Button mode="secondary" size="small" onClick={() => handleOpenModal(teacher)}>
                      Редактировать
                    </Button>
                    <Button mode="tertiary" size="small" onClick={() => handleDelete(teacher.id)}>
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
                  {editingTeacher ? 'Редактировать преподавателя' : 'Создать преподавателя'}
                </Typography.Title>

                <Input
                  label="ФИО преподавателя"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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

export default TeachersPage;

