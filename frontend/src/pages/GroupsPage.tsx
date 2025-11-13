import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Container, Grid, Button, Typography, Flex } from '@maxhub/max-ui';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { apiClient } from '../api/client';
import type { Group, GroupBase } from '../types/api';

function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<GroupBase>({ name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await apiClient.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ name: group.name });
    } else {
      setEditingGroup(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormData({ name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingGroup) {
        await apiClient.updateGroup(editingGroup.id, formData);
      } else {
        await apiClient.createGroup(formData);
      }
      handleCloseModal();
      loadGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Ошибка при сохранении группы');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту группу?')) return;

    try {
      await apiClient.deleteGroup(groupId);
      loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Ошибка при удалении группы');
    }
  };

  return (
    <Panel mode="secondary" style={{ minHeight: '100vh', padding: '20px' }}>
      <Container>
        <Grid gap={24} cols={1}>
          <Flex direction="row" justify="space-between" align="center">
            <Typography.Title variant="large-strong">Группы</Typography.Title>
            <Flex gap={8}>
              <Button mode="primary" onClick={() => handleOpenModal()}>
                Создать группу
              </Button>
              <Button mode="secondary" onClick={() => navigate('/')}>
                Назад
              </Button>
            </Flex>
          </Flex>

          <Grid gap={12} cols={1}>
            {groups.map((group) => (
              <Card key={group.id}>
                <Flex direction="row" justify="space-between" align="center">
                  <Typography.Title variant="small-strong">{group.name}</Typography.Title>
                  <Flex gap={8}>
                    <Button mode="secondary" size="small" onClick={() => handleOpenModal(group)}>
                      Редактировать
                    </Button>
                    <Button mode="tertiary" size="small" onClick={() => handleDelete(group.id)}>
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
                  {editingGroup ? 'Редактировать группу' : 'Создать группу'}
                </Typography.Title>

                <Input
                  label="Название группы"
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

export default GroupsPage;

