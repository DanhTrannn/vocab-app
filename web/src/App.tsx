import { Link, Route, Routes } from 'react-router-dom';

function Placeholder({ label }: { label: string }) {
  return <div className="p-8 text-gray-500">{label}</div>;
}

export default function App() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">
        <Link to="/">Từ Vựng</Link>
      </h1>
      <Routes>
        <Route path="/" element={<Placeholder label="Trang chủ" />} />
        <Route path="/day-sets/:id" element={<Placeholder label="Chi tiết ngày" />} />
        <Route path="/day-sets/:id/quiz" element={<Placeholder label="Làm test" />} />
        <Route path="/day-sets/:id/results" element={<Placeholder label="Kết quả" />} />
      </Routes>
    </div>
  );
}
