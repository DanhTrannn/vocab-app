import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DaySetListItem, GrammarNote, ImportResult, ParseResult } from '../types';

export default function GrammarPage() {
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Import state
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [daySets, setDaySets] = useState<DaySetListItem[]>([]);
  const [selectedDaySetId, setSelectedDaySetId] = useState<number>(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const [n, ds] = await Promise.all([api.listGrammarNotes(), api.listDaySets()]);
      setNotes(n);
      setDaySets(ds);
      if (ds.length > 0 && selectedDaySetId === 0) setSelectedDaySetId(ds[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void load(); }, [load]);

  const closeFormModal = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const openFormModal = (note?: GrammarNote) => {
    if (note) {
      setEditingId(note.id);
      setTitle(note.title);
      setContent(note.content);
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
    }
    setShowForm(true);
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
      closeFormModal();
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xoá được');
    }
  };

  const handleParse = async () => {
    if (pasteText.trim() === '') return;
    setParsing(true);
    setError('');
    try {
      setParsed(await api.parseGrammarText(pasteText));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không parse được nội dung');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsed || selectedDaySetId === 0) return;
    setImporting(true);
    setError('');
    try {
      const result = await api.importGrammarParsed({
        daySetId: selectedDaySetId,
        grammarTitle: parsed.grammarTitle,
        grammarContent: parsed.grammarContent,
        words: parsed.words,
      });
      setImportResult(result);
      setParsed(null);
      setPasteText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không import được');
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImport(false);
    setParsed(null);
    setPasteText('');
    setImportResult(null);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">Ngữ pháp</h1>
          <p className="text-sm text-slate-500 mt-1">{notes.length} ghi chú</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => openFormModal()} className="btn-primary text-sm">
            + Thêm note
          </button>
          <button type="button" onClick={() => { setShowImport(true); setImportResult(null); }} className="btn-secondary text-sm">
            Dán TOEIC
          </button>
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

      {/* Note list */}
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

      {!loading && notes.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="h-7 w-7 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có note nào</h3>
          <p className="text-sm text-slate-500 max-w-xs">Bấm "+ Thêm note" hoặc "Dán TOEIC" để bắt đầu!</p>
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
                    <button type="button" onClick={() => openFormModal(n)} className="btn-ghost text-sm">Sửa</button>
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

      {/* Modal: Add/Edit note */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeFormModal} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId == null ? 'Thêm note mới' : 'Sửa note'}
              </h2>
              <button type="button" onClick={closeFormModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="label">Tiêu đề</span>
              <input
                aria-label="Tiêu đề"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Thì hiện tại đơn"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="label">Nội dung + ví dụ</span>
              <textarea
                aria-label="Nội dung"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field min-h-[150px] resize-y"
                placeholder="Công thức: S + V(s/es)&#10;Ví dụ: She plays tennis every day."
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={closeFormModal} className="btn-ghost">Huỷ</button>
              <button type="button" onClick={() => void handleSubmit()} disabled={saving} className="btn-primary">
                {saving ? 'Đang lưu...' : editingId == null ? 'Thêm note' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import TOEIC */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeImportModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Dán nội dung TOEIC</h2>
              <button type="button" onClick={closeImportModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="label">Chọn bộ từ để thêm từ mới</span>
              <select
                aria-label="Chọn bộ từ"
                value={selectedDaySetId}
                onChange={(e) => setSelectedDaySetId(Number(e.target.value))}
                className="input-field"
              >
                {daySets.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name} ({ds.wordCount} từ)</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="label">Nội dung dán vào đây</span>
              <textarea
                aria-label="Nội dung dán"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="input-field min-h-[180px] resize-y font-mono text-sm"
                placeholder="Dán nội dung TOEIC vào đây..."
              />
            </label>

            <button
              type="button"
              onClick={() => void handleParse()}
              disabled={parsing || pasteText.trim() === ''}
              className="btn-primary w-full"
            >
              {parsing ? 'Đang phân tích...' : 'Phân tích nội dung'}
            </button>

            {parsed && (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900">Kết quả phân tích</h3>

                {parsed.grammarTitle && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <span className="text-xs font-medium text-slate-500 uppercase">Grammar note:</span>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{parsed.grammarTitle}</p>
                    {parsed.grammarContent && (
                      <pre className="whitespace-pre-wrap text-sm text-slate-600 mt-2 font-sans">{parsed.grammarContent}</pre>
                    )}
                  </div>
                )}

                {parsed.words.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase">Từ vựng ({parsed.words.length}):</span>
                    <div className="mt-2 space-y-1.5">
                      {parsed.words.map((w, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                          <span className="font-semibold text-slate-900">{w.english}</span>
                          <span className="text-xs text-slate-400">({w.partOfSpeech})</span>
                          <span className="text-slate-600">{w.meaning}</span>
                          {w.synonyms.length > 0 && (
                            <span className="text-xs text-slate-400 hidden sm:inline">→ {w.synonyms.join(', ')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.words.length === 0 && !parsed.grammarTitle && (
                  <p className="text-sm text-danger-500">Không tìm thấy nội dung. Hãy kiểm tra format dữ liệu.</p>
                )}

                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={importing || selectedDaySetId === 0}
                  className="btn-primary w-full"
                >
                  {importing ? 'Đang lưu...' : 'Lưu tất cả'}
                </button>
              </div>
            )}

            {importResult && (
              <div className="rounded-xl bg-success-50 border border-success-500/20 p-4">
                <h3 className="font-semibold text-success-700 mb-1">Import thành công!</h3>
                <p className="text-sm text-success-600">
                  Đã tạo note "{importResult.grammarNote.title}".
                  Thêm {importResult.wordsCreated} từ mới
                  {importResult.wordsSkipped > 0 && `, bỏ qua ${importResult.wordsSkipped} từ đã tồn tại`}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
