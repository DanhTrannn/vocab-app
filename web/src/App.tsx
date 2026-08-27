import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DaySetPage from './pages/DaySetPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/day-sets/:id" element={<DaySetPage />} />
        <Route path="/day-sets/:id/quiz" element={<QuizPage />} />
        <Route path="/day-sets/:id/results" element={<ResultsPage />} />
      </Routes>
    </Layout>
  );
}
