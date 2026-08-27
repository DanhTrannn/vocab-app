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
                <span className="font-medium text-slate-900">{a.english}</span>
                <SpeakButton text={a.english} />
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  a.mainCorrect
                    ? 'bg-success-50 text-success-600'
                    : 'bg-danger-50 text-danger-600'
                }`}>
                  {a.mainCorrect ? 'Đúng' : 'Sai'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-1.5">{a.meaning}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  Synonyms: <span className="font-medium text-slate-700">{a.synonymsCorrect}/{a.synonymsTotal}</span>
                </span>
                {a.declaredSynonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {a.declaredSynonyms.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {s}
                        <SpeakButton text={s} className="h-4 w-4" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
