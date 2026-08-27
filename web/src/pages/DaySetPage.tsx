import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type WordUpsertBody } from '../api/client';
import SpeakButton from '../components/SpeakButton';
import type { WordDto } from '../types';

const splitSynonyms = (raw: string): string[] => raw.split(',').map((s) => s.trim()).filter(Boolean);

export default function DaySetPage() {
  const { id } = useParams();
  const daySetId = Number(id);

  const [name, setName] = useState('');
  const [words, setWords] = useState<WordDto[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [english, setEnglish] = useState('');
  const [meaning, setMeaning] = useState('');
  const [synonymsRaw, setSynonymsRaw] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const d = await api.getDaySet(daySetId);
      setName(d.name);
      setWords(d.words);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được bộ từ');
    }
  }, [daySetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setEnglish('');
    setMeaning('');
    setSynonymsRaw('');
  };

  const startEdit = (w: WordDto) => {
    setEditingId(w.id);
    setEnglish(w.english);
    setMeaning(w.meaning);
    setSynonymsRaw(w.synonyms.join(', '));
  };

  const handleSubmit = async () => {
    const body: WordUpsertBody = {
      english: english.trim(),
      meaning: meaning.trim(),
      synonyms: splitSynonyms(synonymsRaw),
    };
    if (body.english === '' || body.meaning === '') {
      setError('Vui lòng nhập đủ từ tiếng Anh và nghĩa.');
      return;
    }
    setSaving(true);
    try {
      if (editingId == null) {
        await api.addWord(daySetId, body);
      } else {
        await api.updateWord(editingId, body);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được từ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w: WordDto) => {
    if (!window.confirm(`Xoá từ "${w.english}"?`)) return;
    try {
      await api.deleteWord(w.id);
      if (editingId === w.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xoá được từ');
    }
  };

  return (
    <section className="space-y-6">
      <nav className="space-x-3 text-sm">
        <Link to="/" className="text-blue-700 hover:underline">← Trang chủ</Link>
        <Link to={`/day-sets/${daySetId}/quiz`} className="text-blue-700 hover:underline">Làm test</Link>
        <Link to={`/day-sets/${daySetId}/results`} className="text-blue-700 hover:underline">Kết quả</Link>
      </nav>

      <h2 className="text-xl font-bold">{name}</h2>
      {error && <p role="alert" className="text-red-600">{error}</p>}

      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-sm text-gray-500">
            <th className="py-2">Tiếng Anh</th>
            <th>Nghĩa</th>
            <th>Từ đồng nghĩa</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {words.map((w) => (
            <tr key={w.id} className="border-b">
              <td className="py-2 font-medium">
                {w.english} <SpeakButton text={w.english} />
              </td>
              <td>{w.meaning}</td>
              <td>{w.synonyms.join(', ') || '—'}</td>
              <td className="space-x-3 text-sm">
                <button type="button" onClick={() => startEdit(w)} aria-label={`Sửa ${w.english}`} className="hover:underline">
                  Sửa
                </button>
                <button type="button" onClick={() => void handleDelete(w)} aria-label={`Xoá từ ${w.english}`} className="text-red-600 hover:underline">
                  Xoá
                </button>
              </td>
            </tr>
          ))}
          {words.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-gray-500">Chưa có từ nào — hãy thêm từ trước khi làm test.</td>
            </tr>
          )}
        </tbody>
      </table>

      <form
        className="flex flex-wrap items-end gap-3 rounded border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <h3 className="w-full font-semibold">{editingId == null ? 'Thêm từ mới' : `Sửa từ #${editingId}`}</h3>
        <label className="flex flex-col gap-1 text-sm">
          Từ tiếng Anh
          <input
            aria-label="Từ tiếng Anh"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nghĩa
          <input
            aria-label="Nghĩa"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Từ đồng nghĩa (phân tách bằng dấu phẩy)
          <input
            aria-label="Từ đồng nghĩa (phân tách bằng dấu phẩy)"
            value={synonymsRaw}
            onChange={(e) => setSynonymsRaw(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <button type="submit" disabled={saving} className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50">
          {editingId == null ? 'Thêm từ' : 'Lưu thay đổi'}
        </button>
        {editingId != null && (
          <button type="button" onClick={resetForm} className="px-2 py-1.5">
            Huỷ
          </button>
        )}
      </form>
    </section>
  );
}
