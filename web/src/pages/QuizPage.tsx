import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import SpeakButton from '../components/SpeakButton';
import ResultDetailView from '../components/ResultDetailView';
import type { AnswerPayload, Pronunciation, QuizQuestion, ResultDetail } from '../types';

export default function QuizPage() {
  const { id } = useParams();
  const daySetId = Number(id);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [pronunciations, setPronunciations] = useState<Pronunciation[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getQuiz(daySetId)
      .then((q) => {
        setQuestions(q.questions);
        setPronunciations(q.pronunciations);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được đề test'))
      .finally(() => setLoading(false));
  }, [daySetId]);

  const pronunciationMap = useMemo(
    () => new Map(pronunciations.map((p) => [p.wordId, p.english])),
    [pronunciations],
  );

  const current = questions[idx];

  const updateAnswer = (wordId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [wordId]: value }));
  };

  const handleSubmit = useCallback(async () => {
    const payload = {
      answers: questions.map((q): AnswerPayload => {
        const raw = answers[q.wordId] ?? '';
        const words = raw.split(',').map((s) => s.trim()).filter(Boolean);
        return {
          wordId: q.wordId,
          synonyms: words.length > 0 ? words : undefined,
        };
      }),
    };
    setSubmitting(true);
    try {
      setError('');
      setResult(await api.submitTest(daySetId, payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không nộp được bài');
    } finally {
      setSubmitting(false);
    }
  }, [answers, daySetId, questions]);

  const restart = () => {
    setResult(null);
    setIdx(0);
    setAnswers({});
  };

  const answeredCount = Object.keys(answers).filter((k) => (answers[Number(k)] ?? '').trim() !== '').length;

  if (result) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            result.scorePercent >= 70 ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'
          }`}>
            {result.scorePercent >= 70 ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="section-title">Kết quả bài test</h1>
            <p className="text-2xl font-bold text-primary-600">{result.scorePercent}%</p>
          </div>
        </div>
        <ResultDetailView detail={result} />
        <div className="flex items-center gap-3">
          <button type="button" onClick={restart} className="btn-primary">
            Làm lại
          </button>
          <Link to={`/day-sets/${daySetId}/results`} className="btn-secondary">
            Xem lịch sử
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <nav className="text-sm">
        <Link to={`/day-sets/${daySetId}`} className="text-primary-600 hover:text-primary-700 transition-colors cursor-pointer">
          &larr; Bộ từ
        </Link>
      </nav>

      <h1 className="section-title">Làm test</h1>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-500/20 px-4 py-3 text-sm text-danger-600">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-8">
          <div className="animate-skeleton h-6 w-48 mx-auto mb-4" />
          <div className="animate-skeleton h-10 w-full mb-3" />
          <div className="animate-skeleton h-10 w-full" />
        </div>
      )}

      {!error && !loading && !current && (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-500">Không có câu hỏi nào. Hãy thêm từ vựng trước.</p>
        </div>
      )}

      {!error && !loading && current && (
        <>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="font-medium">
              Câu {idx + 1}/{questions.length}
            </span>
            <span className="text-slate-400">
              {answeredCount}/{questions.length} đã trả lời
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
              style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 text-lg">
              <span className="text-slate-500">Nghĩa:</span>
              <strong className="text-slate-900">{current.meaning}</strong>
              {pronunciationMap.get(current.wordId) != null && (
                <SpeakButton text={pronunciationMap.get(current.wordId)!} />
              )}
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="label">Từ đã nhớ (phân tách bằng dấu phẩy)</span>
              <input
                aria-label="Từ đã nhớ"
                value={answers[current.wordId] ?? ''}
                onChange={(e) => updateAnswer(current.wordId, e.target.value)}
                className="input-field"
                placeholder="happy, glad, cheerful..."
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              className="btn-secondary disabled:opacity-40"
            >
              &larr; Trước
            </button>
            {idx < questions.length - 1 ? (
              <button type="button" onClick={() => setIdx((i) => i + 1)} className="btn-primary">
                Sau &rarr;
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="btn-primary"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang chấm...
                  </span>
                ) : (
                  'Nộp bài'
                )}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
