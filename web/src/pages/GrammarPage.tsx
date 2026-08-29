import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { GrammarNote } from '../types';

export default function GrammarPage() {
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      setNotes(await api.listGrammarNotes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const startEdit = (n: GrammarNote) => {
    setEditingId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setExpandedId(n.id);
  };

  const handleSubmit = async () => {
    if (title.trim() === '' || content.trim() === '') {
      setError('Vui lòng nhập đủ tiêu đề và nội dung.');
      return;
    }
    setSaving(true);
    try {
      if (editingId == null) {
        await api.createGrammarNote(title.trim(), content.trim());
      } else {
        await api.updateGrammarNote(editingId, title.trim(), content.trim());
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (n: GrammarNote) => {
    if (!window.confirm(`Xoá note "${n.title}"?`)) return;
    try {
      await api.deleteGrammarNote(n.id);
      if (editingId === n.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xoá được');
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="section-title">Ngữ pháp</h1>
        <p className="text-sm text-slate-500 mt-1">Ghi chú các quy tắc ngữ pháp và ví dụ</p>
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
              <div className="animate-skeleton h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && !editingId && (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="h-7 w-7 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có note nào</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Thêm ghi chú ngữ pháp bên dưới để bắt đầu!
          </p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-slate-900">{n.title}</span>
                <svg
                  className={`h-5 w-5 text-slate-400 transition-transform ${expandedId === n.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {expandedId === n.id && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 mt-3 font-sans">{n.content}</pre>
                  <div className="flex items-center gap-2 mt-3">
                    <button type="button" onClick={() => startEdit(n)} className="btn-ghost text-sm">
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(n)}
                      className="text-sm text-danger-500 hover:text-danger-600 hover:bg-danger-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              )}
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
          {editingId == null ? 'Thêm note mới' : 'Sửa note'}
        </h3>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label">Tiêu đề</span>
          <input
            aria-label="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Thì hiện tại đơn"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label">Nội dung + ví dụ</span>
          <textarea
            aria-label="Nội dung"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field min-h-[120px] resize-y"
            placeholder="Công thức: S + V(s/es)&#10;Ví dụ: She plays tennis every day."
          />
        </label>
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
              'Thêm note'
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
