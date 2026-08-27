import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import ResultDetailView from '../components/ResultDetailView';
import type { ResultDetail, ResultSummary } from '../types';

export default function ResultsPage() {
  const { id } = useParams();
  const daySetId = Number(id);

  const [setName, setSetName] = useState('');
  const [history, setHistory] = useState<ResultSummary[]>([]);
  const [selected, setSelected] = useState<ResultDetail | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setSelected(null);
      const [d, results] = await Promise.all([api.getDaySet(daySetId), api.listResults(daySetId)]);
      setSetName(d.name);
      setHistory(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được kết quả');
    }
  }, [daySetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (resultId: number) => {
    try {
      setSelected(await api.getResult(resultId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được chi tiết');
    }
  };

  return (
    <section className="space-y-6">
      <nav className="text-sm space-x-3">
        <Link to={`/day-sets/${daySetId}`} className="text-blue-700 hover:underline">← Bộ từ</Link>
        <Link to={`/day-sets/${daySetId}/quiz`} className="text-blue-700 hover:underline">Làm test</Link>
      </nav>

      <h2 className="text-xl font-bold">Kết quả — {setName}</h2>
      {error && <p role="alert" className="text-red-600">{error}</p>}

      {history.length === 0 ? (
        <p className="text-gray-500">Chưa có lần test nào cho ngày này.</p>
      ) : (
        <ul className="divide-y rounded border">
          {history.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => void openDetail(r.id)}
                aria-label={`Xem chi tiết kết quả #${r.id}`}
                className="flex w-full items-center justify-between px-4 py-2 hover:bg-gray-50"
              >
                <span>Lần #{r.id} — {new Date(r.takenAt).toLocaleDateString('vi-VN')}</span>
                <span className="font-semibold">{r.scorePercent}%</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && <ResultDetailView detail={selected} />}
    </section>
  );
}
