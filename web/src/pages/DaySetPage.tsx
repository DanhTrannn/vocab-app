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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [english, setEnglish] = useState('');
  const [meaning, setMeaning] = useState('');
  const [synonymsRaw, setSynonymsRaw] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const d = await api.getDaySet(daySetId);
      setName(d.name);
      setWords(d.words);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được bộ từ');
    } finally {
      setLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">{name}</h1>
          <p className="text-sm text-slate-500 mt-1">{words.length} từ</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/day-sets/${daySetId}/quiz`} className="btn-primary text-sm">
            Làm test
          </Link>
          <Link to={`/day-sets/${daySetId}/results`} className="btn-secondary text-sm">
            Kết quả
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
              <div className="animate-skeleton h-5 w-32 mb-2" />
              <div className="animate-skeleton h-4 w-48" />
            </div>
          ))}
        </div>
      )}

      {!loading && words.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="h-7 w-7 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có từ nào</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Thêm từ vựng bên dưới để bắt đầu học!
          </p>
        </div>
      )}

      {!loading && words.length > 0 && (
        <div className="space-y-2">
          {words.map((w) => (
            <div key={w.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{w.english}</span>
                  <SpeakButton text={w.english} />
                </div>
                <p className="text-sm text-slate-500 truncate">{w.meaning}</p>
                {w.synonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {w.synonyms.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {s}
                        <SpeakButton text={s} className="h-4 w-4" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(w)}
                  aria-label={`Sửa ${w.english}`}
                  className="btn-ghost text-sm"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(w)}
                  aria-label={`Xoá từ ${w.english}`}
                  className="text-slate-400 hover:text-danger-500 p-2 rounded-lg hover:bg-danger-50 transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        className="card p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <h3 className="font-semibold text-slate-900">
          {editingId == null ? 'Thêm từ mới' : `Sửa từ`}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="label">Từ tiếng Anh *</span>
            <input
              aria-label="Từ tiếng Anh"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              className="input-field"
              placeholder="hello"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="label">Nghĩa *</span>
            <input
              aria-label="Nghĩa"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="input-field"
              placeholder="xin chào"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="label">Từ đồng nghĩa</span>
            <input
              aria-label="Từ đồng nghĩa (phân tách bằng dấu phẩy)"
              value={synonymsRaw}
              onChange={(e) => setSynonymsRaw(e.target.value)}
              className="input-field"
              placeholder="hi, greetings"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang lưu...
              </span>
            ) : editingId == null ? (
              'Thêm từ'
            ) : (
              'Lưu thay đổi'
            )}
          </button>
          {editingId != null && (
            <button type="button" onClick={resetForm} className="btn-ghost">
              Huỷ
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
