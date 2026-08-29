import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DaySetListItem, GrammarNote, ImportResult, ParseResult } from '../types';

type Tab = 'notes' | 'import';

export default function GrammarPage() {
  const [tab, setTab] = useState<Tab>('notes');
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Auto-import state
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
      if (ds.length > 0 && selectedDaySetId === 0) {
        setSelectedDaySetId(ds[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }, [selectedDaySetId]);

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

  const handleParse = async () => {
    if (pasteText.trim() === '') return;
    setParsing(true);
    setError('');
    try {
      const result = await api.parseGrammarText(pasteText);
      setParsed(result);
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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="section-title">Ngữ pháp</h1>
        <p className="text-sm text-slate-500 mt-1">Ghi chú quy tắc ngữ pháp hoặc dán nội dung tự tạo từ vựng</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab('notes')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
            tab === 'notes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Ghi chú thủ công
        </button>
        <button
          type="button"
          onClick={() => setTab('import')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
            tab === 'import' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Tạo từ tự động
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-500/20 px-4 py-3 text-sm text-danger-600">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Tab: Notes */}
      {tab === 'notes' && (
        <>
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
                Thêm ghi chú ngữ pháp bên dưới hoặc dùng tab "Tạo từ tự động"!
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
            onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
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
                {saving ? 'Đang lưu...' : editingId == null ? 'Thêm note' : 'Lưu thay đổi'}
              </button>
              {editingId != null && (
                <button type="button" onClick={resetForm} className="btn-ghost">Huỷ</button>
              )}
            </div>
          </form>
        </>
      )}

      {/* Tab: Auto-import */}
      {tab === 'import' && (
        <>
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-900">Dán nội dung TOEIC</h3>
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
                className="input-field min-h-[200px] resize-y font-mono text-sm"
                placeholder="#1. Dịch nghĩa câu hỏi...&#10;#2. Đáp án chính xác...&#10;#3. Giải thích chi tiết...&#10;#4. Từ vựng & Từ đồng nghĩa..."
              />
            </label>
            <button
              type="button"
              onClick={() => void handleParse()}
              disabled={parsing || pasteText.trim() === ''}
              className="btn-primary"
            >
              {parsing ? 'Đang phân tích...' : 'Phân tích nội dung'}
            </button>
          </div>

          {parsed && (
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-slate-900">Kết quả phân tích</h3>

              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Grammar note:</span>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{parsed.grammarTitle || '(không tìm thấy)'}</p>
                </div>
                {parsed.grammarContent && (
                  <pre className="whitespace-pre-wrap text-sm text-slate-600 bg-slate-50 rounded-lg p-3 font-sans">{parsed.grammarContent}</pre>
                )}
              </div>

              {parsed.words.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Từ vựng ({parsed.words.length}):</span>
                  <div className="mt-2 space-y-2">
                    {parsed.words.map((w, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm bg-slate-50 rounded-lg p-3">
                        <span className="font-semibold text-slate-900">{w.english}</span>
                        <span className="text-xs text-slate-400 mt-0.5">({w.partOfSpeech})</span>
                        <span className="text-slate-600">{w.meaning}</span>
                        {w.synonyms.length > 0 && (
                          <span className="text-xs text-slate-400">→ {w.synonyms.join(', ')}</span>
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
                className="btn-primary"
              >
                {importing ? 'Đang lưu...' : 'Lưu tất cả'}
              </button>
            </div>
          )}

          {importResult && (
            <div className="card p-5 bg-success-50 border border-success-500/20">
              <h3 className="font-semibold text-success-700 mb-2">Import thành công!</h3>
              <p className="text-sm text-success-600">
                Đã tạo note "{importResult.grammarNote.title}".
                Thêm {importResult.wordsCreated} từ mới
                {importResult.wordsSkipped > 0 && `, bỏ qua ${importResult.wordsSkipped} từ đã tồn tại`}.
              </p>
              <button type="button" onClick={() => setImportResult(null)} className="btn-ghost text-sm mt-2">
                Đóng
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
