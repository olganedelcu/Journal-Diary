import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import WelcomePage from './pages/WelcomePage';
import EntriesPage from './pages/EntriesPage';
import ViewEntryPage from './pages/ViewEntryPage';
import EditEntryPage from './pages/EditEntryPage';
import TimelinePage from './pages/TimelinePage';
import PhotosPage from './pages/PhotosPage';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your journal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/entries" element={<EntriesPage />} />
      <Route path="/entries/new" element={<EditEntryPage key="new" />} />
      <Route path="/entries/:id" element={<ViewEntryPage />} />
      <Route path="/entries/:id/edit" element={<EditEntryPage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/photos" element={<PhotosPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
