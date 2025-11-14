import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppStateProvider } from './contexts/AppStateContext';
import { ToastProvider } from './contexts/ToastContext';
import LoginPageSimple from './pages/LoginPageSimple';
import HomePage from './pages/HomePage';
import TodayPageSimple from './pages/TodayPageSimple';
import TaskPageSimple from './pages/TaskPageSimple';
import TaskFormPageSimple from './pages/TaskFormPageSimple';
import ContextsPageSimple from './pages/ContextsPageSimple';
import ContextPageSimple from './pages/ContextPageSimple';
import InboxPageSimple from './pages/InboxPageSimple';
import SearchPageSimple from './pages/SearchPageSimple';
import SchedulePage from './pages/SchedulePage';
import ScheduleManagementPage from './pages/ScheduleManagementPage';
import GroupsPage from './pages/GroupsPage';
import TeachersPage from './pages/TeachersPage';
import SubjectsPage from './pages/SubjectsPage';
import DocumentsPage from './pages/DocumentsPage';
import DormitoryPage from './pages/DormitoryPage';
import LibraryPage from './pages/LibraryPage';
import DeaneryPage from './pages/DeaneryPage';
import FinancialPage from './pages/FinancialPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
 return (
    <ToastProvider>
      <AppStateProvider>
        <Routes>
          <Route path="/login" element={<LoginPageSimple />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <TodayPageSimple />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/new"
        element={
          <ProtectedRoute>
            <TaskFormPageSimple />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id/edit"
        element={
          <ProtectedRoute>
            <TaskFormPageSimple />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute>
            <TaskPageSimple />
          </ProtectedRoute>
        }
      />
      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <TodayPageSimple />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contexts"
        element={
          <ProtectedRoute>
            <ContextsPageSimple />
          </ProtectedRoute>
        }
      />
        <Route
          path="/contexts/:id"
          element={
            <ProtectedRoute>
              <ContextPageSimple />
            </ProtectedRoute>
          }
        />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute>
            <InboxPageSimple />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPageSimple />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <SchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule/manage"
        element={
          <ProtectedRoute>
            <ScheduleManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teachers"
        element={
          <ProtectedRoute>
            <TeachersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subjects"
        element={
          <ProtectedRoute>
            <SubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dormitory"
        element={
          <ProtectedRoute>
            <DormitoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deanery"
        element={
          <ProtectedRoute>
            <DeaneryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial"
        element={
          <ProtectedRoute>
            <FinancialPage />
          </ProtectedRoute>
        }
      />
    </Routes>
      </AppStateProvider>
    </ToastProvider>
  );
}

export default App;

