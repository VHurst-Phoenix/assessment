import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AssessmentPage from './pages/AssessmentPage';
import AssessmentCompletePage from './pages/AssessmentCompletePage';
import BlogPage from './pages/BlogPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RecordDetails from './pages/RecordDetails';
import ClientStoriesPage from './pages/ClientStoriesPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/assessment-complete" element={<AssessmentCompletePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/client-stories" element={<ClientStoriesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/record/:type/:id"
          element={(
            <ProtectedRoute>
              <RecordDetails />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </Layout>
  );
}

export default App;
