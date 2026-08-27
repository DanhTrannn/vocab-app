import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DaySetListItem } from '../types';

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export default function HomePage() {
  const [sets, setSets] = useState<DaySetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState(todayIso());
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      setSets(await api.listDaySets());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.createDaySet(name.trim() || undefined);
      setName(todayIso());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được bộ từ');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (set: DaySetListItem) => {
    if (!window.confirm(`Xoá bộ "${set.name}" cùng toàn bộ từ và kết quả test?`)) return;
    try {
      await api.deleteDaySet(set.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xoá được bộ từ');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="section-title">Bộ từ của tôi</h1>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="label">Tên bộ từ</span>
            <input
              aria-label="Tên bộ từ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-40"
            />
          </label>
          <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
            {creating ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang tạo...
              </span>
            ) : (
              '+ Tạo bộ mới'
            )}
          </button>
        </form>
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
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="animate-skeleton h-5 w-32 mb-3" />
              <div className="animate-skeleton h-4 w-20 mb-2" />
              <div className="animate-skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && sets.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có bộ từ nào</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Tạo bộ từ đầu tiên để bắt đầu học tiếng Anh mỗi ngày!
          </p>
        </div>
      )}

      {!loading && sets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {sets.map((s) => (
            <div key={s.id} className="card group p-5">
              <div className="flex items-start justify-between mb-3">
                <Link
                  to={`/day-sets/${s.id}`}
                  className="text-lg font-semibold text-slate-900 hover:text-primary-600 transition-colors cursor-pointer"
                >
                  {s.name}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(s)}
                  aria-label={`Xoá bộ ${s.name}`}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-danger-500 transition-all cursor-pointer p-1 rounded-lg hover:bg-danger-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  {s.wordCount} từ
                </span>
                {s.latestScorePercent != null && (
                  <span
                    className={`font-medium ${
                      s.latestScorePercent >= 70
                        ? 'text-success-600'
                        : s.latestScorePercent >= 40
                          ? 'text-warning-500'
                          : 'text-danger-500'
                    }`}
                  >
                    {s.latestScorePercent}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/day-sets/${s.id}`} className="btn-secondary text-sm flex-1 justify-center">
                  Xem từ
                </Link>
                <Link to={`/day-sets/${s.id}/quiz`} className="btn-primary text-sm flex-1 justify-center">
                  Làm test
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
