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
  TaskUpdate,
  Context,
  ContextCreate,
  ContextUpdate,
  AuthWithMAXResponse,
  ErrorResponse,
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
      (error: AxiosError<ErrorResponse>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          console.error('[API] Unauthorized - token removed');
        }
        
        // Улучшенная обработка ошибок
        if (error.response?.data?.error) {
          console.error('[API Error]', error.response.data.error);
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

  async loginWithMAX(max_user_id: string): Promise<AuthWithMAXResponse> {
    const response = await this.client.post<AuthWithMAXResponse>('/api/auth/max', {
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
    const response = await this.client.get<{ tasks: Task[] }>('/api/tasks');
    return response.data.tasks;
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await this.client.get<Task>(`/api/tasks/${taskId}`);
    return response.data;
  }

  async createTask(data: TaskCreate): Promise<Task> {
    const response = await this.client.post<Task>('/api/tasks', data);
    return response.data;
  }

  async updateTask(taskId: string, data: TaskUpdate): Promise<Task> {
    const response = await this.client.patch<Task>(`/api/tasks/${taskId}`, data);
    return response.data;
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    console.log('[API] Updating task status:', { taskId, status });
    try {
      const response = await this.client.patch<{ status: string }>(`/api/tasks/${taskId}/status`, { status });
      console.log('[API] Task status updated:', response.data);
    } catch (error) {
      console.error('[API] Failed to update task status:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.client.delete<{ status: string }>(`/api/tasks/${taskId}`);
  }

  // Contexts
  async getContexts(): Promise<Context[]> {
    const response = await this.client.get<{ contexts: Context[] }>('/api/contexts');
    return response.data.contexts;
  }

  async getContext(contextId: string): Promise<Context> {
    const response = await this.client.get<Context>(`/api/contexts/${contextId}`);
    return response.data;
  }

  async createContext(data: ContextCreate): Promise<Context> {
    const response = await this.client.post<Context>('/api/contexts', data);
    return response.data;
  }

  async updateContext(contextId: string, data: ContextUpdate): Promise<Context> {
    const response = await this.client.patch<Context>(`/api/contexts/${contextId}`, data);
    return response.data;
  }

  async deleteContext(contextId: string): Promise<void> {
    await this.client.delete<{ status: string }>(`/api/contexts/${contextId}`);
  }

  // Search
  async search(query: string): Promise<{ tasks: Task[]; contexts: Context[] }> {
    const response = await this.client.get<{ tasks: Task[]; contexts: Context[] }>('/api/search', {
      params: { q: query }
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

