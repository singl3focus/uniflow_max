import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Token,
  University,
  UniversityCreate,
  UserCreate,
  UserInDB,
  Group,
  GroupBase,
  Teacher,
  TeacherBase,
  Subject,
  SubjectBase,
  ScheduleEvent,
  ScheduleEventCreate,
  Task,
  TaskCreate,
  Context,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:50031';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      console.log('[API Request] Token check:', { hasToken: !!token, tokenLength: token?.length || 0, path: config.url });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API Request] Token added to headers');
      } else {
        console.log('[API Request] No token found in localStorage');
      }
      return config;
    });

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          // Не перенаправляем здесь - позволим компоненту обработать это
          console.error('[API] Unauthorized - token removed');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(username: string, password: string): Promise<Token> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    const response = await this.client.post<Token>('/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async loginWithMAX(max_user_id: string): Promise<Token> {
    const response = await this.client.post<Token>('/api/auth/max', {
      max_user_id
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  // Super Admin
  async createUniversity(data: UniversityCreate): Promise<University> {
    const response = await this.client.post<University>('/api/superadmin/universities/', data);
    return response.data;
  }

  async createUser(data: UserCreate): Promise<UserInDB> {
    const response = await this.client.post<UserInDB>('/api/superadmin/users/', data);
    return response.data;
  }

  // University Admin - Groups
  async createGroup(data: GroupBase): Promise<Group> {
    const response = await this.client.post<Group>('/api/university/groups/', data);
    return response.data;
  }

  async updateGroup(groupId: number, data: GroupBase): Promise<Group> {
    const response = await this.client.put<Group>(`/api/university/groups/${groupId}`, data);
    return response.data;
  }

  async deleteGroup(groupId: number): Promise<void> {
    await this.client.delete(`/api/university/groups/${groupId}`);
  }

  // University Admin - Teachers
  async createTeacher(data: TeacherBase): Promise<Teacher> {
    const response = await this.client.post<Teacher>('/api/university/teachers/', data);
    return response.data;
  }

  async updateTeacher(teacherId: number, data: TeacherBase): Promise<Teacher> {
    const response = await this.client.put<Teacher>(`/api/university/teachers/${teacherId}`, data);
    return response.data;
  }

  async deleteTeacher(teacherId: number): Promise<void> {
    await this.client.delete(`/api/university/teachers/${teacherId}`);
  }

  // University Admin - Subjects
  async createSubject(data: SubjectBase): Promise<Subject> {
    const response = await this.client.post<Subject>('/api/university/subjects/', data);
    return response.data;
  }

  async updateSubject(subjectId: number, data: SubjectBase): Promise<Subject> {
    const response = await this.client.put<Subject>(`/api/university/subjects/${subjectId}`, data);
    return response.data;
  }

  async deleteSubject(subjectId: number): Promise<void> {
    await this.client.delete(`/api/university/subjects/${subjectId}`);
  }

  // Schedule Management
  async createScheduleEvent(data: ScheduleEventCreate): Promise<ScheduleEvent> {
    const response = await this.client.post<ScheduleEvent>('/api/schedule/', data);
    return response.data;
  }

  async updateScheduleEvent(eventId: number, data: ScheduleEventCreate): Promise<ScheduleEvent> {
    const response = await this.client.put<ScheduleEvent>(`/api/schedule/${eventId}`, data);
    return response.data;
  }

  async deleteScheduleEvent(eventId: number): Promise<void> {
    await this.client.delete(`/api/schedule/${eventId}`);
  }

  // Data Retrieval
  async getSchedule(params?: {
    group_id?: number | null;
    teacher_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
  }): Promise<ScheduleEvent[]> {
    const response = await this.client.get<ScheduleEvent[]>('/api/utils/schedule/', { params });
    return response.data;
  }

  async getGroups(): Promise<Group[]> {
    const response = await this.client.get<Group[]>('/api/utils/groups');
    return response.data;
  }

  async getTeachers(): Promise<Teacher[]> {
    const response = await this.client.get<Teacher[]>('/api/utils/teachers');
    return response.data;
  }

  async getSubjects(): Promise<Subject[]> {
    const response = await this.client.get<Subject[]>('/api/utils/subjects');
    return response.data;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const response = await this.client.get<Task[]>('/api/tasks');
    return response.data;
  }

  async createTask(data: TaskCreate): Promise<Task> {
    const response = await this.client.post<Task>('/api/tasks', data);
    return response.data;
  }

  async updateTask(taskId: number, data: Partial<TaskCreate>): Promise<Task> {
    const response = await this.client.put<Task>(`/api/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.client.delete(`/api/tasks/${taskId}`);
  }

  // Contexts
  async getContexts(): Promise<Context[]> {
    const response = await this.client.get<Context[]>('/api/contexts');
    return response.data;
  }
}

export const apiClient = new ApiClient();

