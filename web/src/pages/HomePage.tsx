import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DaySetListItem } from '../types';

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export default function HomePage() {
  const [sets, setSets] = useState<DaySetListItem[]>([]);
  const [error, setError] = useState('');
  const [name, setName] = useState(todayIso());
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setSets(await api.listDaySets());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu');
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
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleCreate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Tên bộ từ
          <input
            aria-label="Tên bộ từ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Tạo bộ mới
        </button>
      </form>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!error && sets.length === 0 && <p className="text-gray-500">Chưa có bộ từ nào — hãy tạo bộ đầu tiên.</p>}

      {sets.length > 0 && (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b text-sm text-gray-500">
              <th className="py-2">Ngày</th>
              <th>Số từ</th>
              <th>Điểm gần nhất</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2 font-medium">
                  <Link to={`/day-sets/${s.id}`} className="text-blue-700 hover:underline">{s.name}</Link>
                </td>
                <td>{s.wordCount} từ</td>
                <td>{s.latestScorePercent == null ? '—' : `${s.latestScorePercent}%`}</td>
                <td className="space-x-3 text-sm">
                  <Link to={`/day-sets/${s.id}`} className="hover:underline">Xem từ</Link>
                  <Link to={`/day-sets/${s.id}/quiz`} className="hover:underline">Làm test</Link>
                  <Link to={`/day-sets/${s.id}/results`} className="hover:underline">Kết quả</Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(s)}
                    aria-label={`Xoá bộ ${s.name}`}
                    className="text-red-600 hover:underline"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}