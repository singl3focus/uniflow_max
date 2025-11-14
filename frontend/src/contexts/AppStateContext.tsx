import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { Task, Context } from '../types/api';

interface AppState {
  tasks: Task[];
  contexts: Context[];
  loading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  refreshTasks: () => Promise<void>;
  refreshContexts: () => Promise<void>;
  refreshAll: () => Promise<void>;
  updateTaskLocally: (taskId: string, updates: Partial<Task>) => void;
  removeTaskLocally: (taskId: string) => void;
  addTaskLocally: (task: Task) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    tasks: [],
    contexts: [],
    loading: false,
    error: null,
  });

  const refreshTasks = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const tasks = await apiClient.getTasks();
      setState((prev) => ({ ...prev, tasks, loading: false }));
    } catch (error: any) {
      console.error('[AppState] Failed to refresh tasks:', error);
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  const refreshContexts = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const contexts = await apiClient.getContexts();
      setState((prev) => ({ ...prev, contexts, loading: false }));
    } catch (error: any) {
      console.error('[AppState] Failed to refresh contexts:', error);
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const [tasks, contexts] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getContexts(),
      ]);
      setState((prev) => ({ ...prev, tasks, contexts, loading: false }));
    } catch (error: any) {
      console.error('[AppState] Failed to refresh all:', error);
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  const updateTaskLocally = useCallback((taskId: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  }, []);

  const removeTaskLocally = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
    }));
  }, []);

  const addTaskLocally = useCallback((task: Task) => {
    setState((prev) => ({
      ...prev,
      tasks: [task, ...prev.tasks],
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshTasks,
        refreshContexts,
        refreshAll,
        updateTaskLocally,
        removeTaskLocally,
        addTaskLocally,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
