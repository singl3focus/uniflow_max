import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Select from '../components/Select';
import { apiClient } from '../api/client';
import type { ScheduleEvent, ScheduleEventCreate, Group, Teacher, Subject } from '../types/api';

function ScheduleManagementPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [formData, setFormData] = useState<ScheduleEventCreate>({
    start_time: '',
    end_time: '',
    classroom: '',
    subject_id: 0,
    teacher_id: 0,
    group_id: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadSchedule();
  }, []);

  const loadData = async () => {
    try {
      const [groupsData, teachersData, subjectsData] = await Promise.all([
        apiClient.getGroups(),
        apiClient.getTeachers(),
        apiClient.getSubjects(),
      ]);
      setGroups(groupsData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const data = await apiClient.getSchedule();
      setEvents(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleOpenModal = (event?: ScheduleEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        start_time: event.start_time.slice(0, 16),
        end_time: event.end_time.slice(0, 16),
        classroom: event.classroom,
        subject_id: event.subject_id,
        teacher_id: event.teacher_id,
        group_id: event.group_id,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        start_time: '',
        end_time: '',
        classroom: '',
        subject_id: 0,
        teacher_id: 0,
        group_id: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEvent) {
        await apiClient.updateScheduleEvent(editingEvent.id, formData);
      } else {
        await apiClient.createScheduleEvent(formData);
      }
      handleCloseModal();
      loadSchedule();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Ошибка при сохранении события');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) return;

    try {
      await apiClient.deleteScheduleEvent(eventId);
      loadSchedule();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Ошибка при удалении события');
    }
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Управление расписанием</Typography.Title>
            <Flex gap={8}>
              <Button mode="primary" onClick={() => handleOpenModal()}>
                Создать событие
              </Button>
              <Button mode="secondary" onClick={() => navigate('/')}>
                Назад
              </Button>
            </Flex>
          </Flex>

          <Grid gap={12} cols={1}>
            {events.map((event) => (
              <Card key={event.id}>
                <Flex direction="row" justify="space-between" align="flex-start">
                  <Grid gap={8} cols={1} style={{ flex: 1 }}>
                    <Typography.Title variant="small-strong">{event.subject.name}</Typography.Title>
                    <Typography.Action>
                      <strong>Преподаватель:</strong> {event.teacher.full_name}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Группа:</strong> {event.group.name}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Время:</strong> {new Date(event.start_time).toLocaleString('ru-RU')} - {new Date(event.end_time).toLocaleString('ru-RU')}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Аудитория:</strong> {event.classroom}
                    </Typography.Action>
                  </Grid>
                  <Flex gap={8}>
                    <Button mode="secondary" size="small" onClick={() => handleOpenModal(event)}>
                      Редактировать
                    </Button>
                    <Button mode="tertiary" size="small" onClick={() => handleDelete(event.id)}>
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
                  {editingEvent ? 'Редактировать событие' : 'Создать событие'}
                </Typography.Title>

                <Select
                  label="Группа"
                  required
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) })}
                >
                  <option value={0}>Выберите группу</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Преподаватель"
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: Number(e.target.value) })}
                >
                  <option value={0}>Выберите преподавателя</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Предмет"
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                >
                  <option value={0}>Выберите предмет</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Начало"
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />

                <Input
                  label="Конец"
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />

                <Input
                  label="Аудитория"
                  required
                  value={formData.classroom}
                  onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
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

export default ScheduleManagementPage;

