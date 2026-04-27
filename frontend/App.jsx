import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { SocketProvider } from './contexts/SocketContext';
import AppShell from './layouts/AppShell';
import ChatPage from './pages/ChatPage';
import FeedPage from './pages/FeedPage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <AppProvider>
      <SocketProvider>
        <AppShell>
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </AppShell>
      </SocketProvider>
    </AppProvider>
  );
}

export default App;
