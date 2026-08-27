import SpeakButton from './SpeakButton';
import type { ResultDetail } from '../types';

export default function ResultDetailView({ detail }: { detail: ResultDetail }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold">Điểm: {detail.scorePercent}%</h3>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2">Từ</th>
            <th>Nghĩa</th>
            <th>Từ chính</th>
            <th>Synonyms đúng</th>
            <th>Synonyms đã khai báo</th>
          </tr>
        </thead>
        <tbody>
          {detail.answers.map((a) => (
            <tr key={a.wordId} className="border-b align-top">
              <td className="py-2 font-medium">
                {a.english} <SpeakButton text={a.english} />
              </td>
              <td>{a.meaning}</td>
              <td>
                {a.mainCorrect
                  ? <span className="font-semibold text-green-700">Đúng</span>
                  : <span className="font-semibold text-red-600">Sai</span>}
              </td>
              <td>{a.synonymsCorrect}/{a.synonymsTotal}</td>
              <td>{a.declaredSynonyms.join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
