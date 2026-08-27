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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setSelected(null);
      setLoading(true);
      const [d, results] = await Promise.all([api.getDaySet(daySetId), api.listResults(daySetId)]);
      setSetName(d.name);
      setHistory(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được kết quả');
    } finally {
      setLoading(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success-600 bg-success-50';
    if (score >= 40) return 'text-warning-500 bg-warning-50';
    return 'text-danger-500 bg-danger-50';
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">Kết quả</h1>
          <p className="text-sm text-slate-500 mt-1">{setName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/day-sets/${daySetId}`} className="btn-secondary text-sm">
            Bộ từ
          </Link>
          <Link to={`/day-sets/${daySetId}/quiz`} className="btn-primary text-sm">
            Làm test
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-500/20 px-4 py-3 text-sm text-danger-600">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="animate-skeleton h-5 w-40 mb-2" />
              <div className="animate-skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="h-7 w-7 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có kết quả</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Làm bài test để xem kết quả tại đây!
          </p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="space-y-2">
          {history.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => void openDetail(r.id)}
              aria-label={`Xem chi tiết kết quả #${r.id}`}
              className="card w-full flex items-center gap-4 p-4 text-left hover:border-primary-200 transition-colors cursor-pointer"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg ${getScoreColor(r.scorePercent)}`}>
                {r.scorePercent}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">Lần #{r.id}</p>
                <p className="text-sm text-slate-500">
                  {new Date(r.takenAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {selected && <ResultDetailView detail={selected} />}
    </section>
  );
}
