import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Card from '../components/Card';
import Select from '../components/Select';
import { apiClient } from '../api/client';
import type { ScheduleEvent, Group, Teacher } from '../types/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

function SchedulePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [selectedGroupId, selectedTeacherId, startDate, endDate]);

  const loadData = async () => {
    try {
      const [groupsData, teachersData] = await Promise.all([
        apiClient.getGroups(),
        apiClient.getTeachers(),
      ]);
      setGroups(groupsData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSchedule({
        group_id: selectedGroupId,
        teacher_id: selectedTeacherId,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      setEvents(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'HH:mm');
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Расписание</Typography.Title>
            <Button mode="secondary" onClick={() => navigate('/')}>
              Назад
            </Button>
          </Flex>

          <Grid gap={16} cols={1}>
            <Select
              label="Группа"
              labelColor="#ffffff"
              value={selectedGroupId?.toString() || ''}
              onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Все группы</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>

            <Select
              label="Преподаватель"
              labelColor="#ffffff"
              value={selectedTeacherId?.toString() || ''}
              onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Все преподаватели</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                </option>
              ))}
            </Select>

            <Input
              label="Начальная дата"
              type="date"
              value={startDate}
              labelColor="#ffffff"
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Конечная дата"
              type="date"
              value={endDate}
              labelColor="#ffffff"
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>

          {loading ? (
            <Typography.Action>Загрузка...</Typography.Action>
          ) : events.length === 0 ? (
            <Typography.Action color="secondary">Нет занятий</Typography.Action>
          ) : (
            <Grid gap={12} cols={1}>
              {events.map((event) => (
                <Card key={event.id}>
                  <Grid gap={8} cols={1}>
                    <Typography.Title variant="small-strong">{event.subject.name}</Typography.Title>
                    <Typography.Action>
                      <strong>Преподаватель:</strong> {event.teacher.full_name}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Группа:</strong> {event.group.name}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Время:</strong> {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Дата:</strong> {formatDateTime(event.start_time)}
                    </Typography.Action>
                    <Typography.Action>
                      <strong>Аудитория:</strong> {event.classroom}
                    </Typography.Action>
                  </Grid>
                </Card>
              ))}
            </Grid>
          )}
        </Grid>
      </Container>
    </Panel>
  );
}

export default SchedulePage;

