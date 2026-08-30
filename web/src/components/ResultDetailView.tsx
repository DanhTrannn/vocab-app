import SpeakButton from './SpeakButton';
import type { ResultDetail } from '../types';

export default function ResultDetailView({ detail }: { detail: ResultDetail }) {
  return (
    <section className="space-y-4">
      <div className="card overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Chi tiết kết quả</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {detail.answers.map((a) => (
            <div key={a.wordId} className="px-5 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900">{a.meaning}</span>
                <SpeakButton text={a.english} />
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  a.scorePercent === 100
                    ? 'bg-success-50 text-success-600'
                    : a.scorePercent > 0
                      ? 'bg-warning-50 text-warning-500'
                      : 'bg-danger-50 text-danger-600'
                }`}>
                  {a.scorePercent}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {a.correctWords.map((w, i) => (
                  <span key={`c-${i}`} className="inline-flex items-center gap-0.5 rounded-full bg-success-50 px-2 py-0.5 text-xs text-success-600 font-medium">
                    {w}
                    <SpeakButton text={w} className="h-4 w-4" />
                  </span>
                ))}
                {a.missedWords.map((w, i) => (
                  <span key={`m-${i}`} className="inline-flex items-center gap-0.5 rounded-full bg-danger-50 px-2 py-0.5 text-xs text-danger-600 line-through">
                    {w}
                    <SpeakButton text={w} className="h-4 w-4" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
