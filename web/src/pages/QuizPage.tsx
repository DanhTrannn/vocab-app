import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import SpeakButton from '../components/SpeakButton';
import ResultDetailView from '../components/ResultDetailView';
import type { AnswerPayload, Pronunciation, QuizQuestion, ResultDetail } from '../types';

interface AnswerState {
  english: string;
  synonyms: string;
}

export default function QuizPage() {
  const { id } = useParams();
  const daySetId = Number(id);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [pronunciations, setPronunciations] = useState<Pronunciation[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getQuiz(daySetId)
      .then((q) => {
        setQuestions(q.questions);
        setPronunciations(q.pronunciations);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được đề test'));
  }, [daySetId]);

  const pronunciationMap = useMemo(
    () => new Map(pronunciations.map((p) => [p.wordId, p.english])),
    [pronunciations],
  );

  const current = questions[idx];
  const answerOf = (wordId: number): AnswerState => answers[wordId] ?? { english: '', synonyms: '' };

  const update = (wordId: number, patch: Partial<AnswerState>) => {
    setAnswers((prev) => ({ ...prev, [wordId]: { ...answerOf(wordId), ...patch } }));
  };

  const handleSubmit = useCallback(async () => {
    const payload = {
      answers: questions.map((q): AnswerPayload => {
        const a = answerOf(q.wordId);
        const out: AnswerPayload = { wordId: q.wordId };
        const en = a.english.trim();
        const syns = a.synonyms.split(',').map((s) => s.trim()).filter(Boolean);
        if (en !== '') out.english = en;
        if (syns.length > 0) out.synonyms = syns;
        return out;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, daySetId, questions]);

  const restart = () => {
    setResult(null);
    setIdx(0);
    setAnswers({});
  };

  if (result) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Kết quả bài test</h2>
        <ResultDetailView detail={result} />
        <div className="space-x-3">
          <button type="button" onClick={restart} className="rounded bg-blue-600 px-3 py-1.5 text-white">
            Làm lại
          </button>
          <Link to={`/day-sets/${daySetId}/results`} className="text-blue-700 hover:underline">
            Xem lịch sử
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <nav className="text-sm">
        <Link to={`/day-sets/${daySetId}`} className="text-blue-700 hover:underline">← Bộ từ</Link>
      </nav>
      <h2 className="text-xl font-bold">Làm test</h2>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!error && !current && <p className="text-gray-500">Đang tải đề…</p>}
      {!error && current && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Câu {idx + 1}/{questions.length}</span>
            <div className="h-1.5 w-48 rounded bg-gray-200">
              <div
                className="h-full rounded bg-blue-600"
                style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-4 rounded border p-6">
            <p className="text-lg">
              Nghĩa: <strong>{current.meaning}</strong>
              {pronunciationMap.get(current.wordId) != null && (
                <>
                  {' '}
                  <SpeakButton text={pronunciationMap.get(current.wordId)!} />
                </>
              )}
            </p>
            <label className="flex flex-col gap-1 text-sm">
              Từ tiếng Anh
              <input
                aria-label="Từ tiếng Anh"
                value={answerOf(current.wordId).english}
                onChange={(e) => update(current.wordId, { english: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Từ đồng nghĩa
              <input
                aria-label="Từ đồng nghĩa"
                value={answerOf(current.wordId).synonyms}
                onChange={(e) => update(current.wordId, { synonyms: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              className="rounded border px-3 py-1.5 disabled:opacity-40"
            >
              ← Trước
            </button>
            {idx < questions.length - 1 ? (
              <button type="button" onClick={() => setIdx((i) => i + 1)} className="rounded border px-3 py-1.5">
                Sau →
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="rounded bg-blue-600 px-4 py-1.5 text-white disabled:opacity-50"
              >
                Nộp bài
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
