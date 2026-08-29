import { describe, expect, it } from 'vitest';
import { parseGrammarInput } from '../src/lib/parser.js';

const sampleWithHash = `#1. Dịch nghĩa câu hỏi & các lựa chọn
Câu gốc: The building manager will not authorize ___ renovations until the annual budget has been finalized.
Dịch nghĩa câu: Quản lý tòa nhà sẽ không cho phép ________ sự cải tạo nào.

#2. Đáp án chính xác
Đáp án: (B) any

#3. Giải thích chi tiết
Tiêu đề: Sử dụng đại từ định lượng "Any" trong câu phủ định
Nội dung:
Câu này có chứa từ "not", dấu hiệu của câu phủ định.
Chúng ta sử dụng "any" trước danh từ số nhiều trong câu phủ định.

#4. Từ vựng & Từ đồng nghĩa (TOEIC)
Authorize (v): Cho phép, cấp phép, ủy quyền
Từ đồng nghĩa: Approve, Permit, Allow, Sanction.
Renovations (n): Sự cải tạo, sửa chữa, nâng cấp
Từ đồng nghĩa: Remodeling, Refurbishment, Restoration.
Manager (n): Người quản lý, giám sát
Từ đồng nghĩa: Supervisor, Director, Head.`;

const sampleWithoutHash = `1. Dịch nghĩa câu hỏi & các lựa chọn
Câu gốc: The building manager will not authorize ___ renovations.
Dịch nghĩa câu: Quản lý tòa nhà sẽ không cho phép sự cải tạo nào.

2. Đáp án chính xác
Đáp án: (B) any

3. Giải thích chi tiết
Tiêu đề: Sử dụng "Any" trong câu phủ định
Nội dung:
Câu có chứa từ "not".

4. Từ vựng & Từ đồng nghĩa (TOEIC)
Authorize (v): Cho phép
Từ đồng nghĩa: Approve, Permit, Allow.
Finalized (v): Hoàn tất
Từ đồng nghĩa: Completed, Settled.`;

describe('parseGrammarInput', () => {
  it('extracts grammar title and content from section #3', () => {
    const result = parseGrammarInput(sampleWithHash);
    expect(result.grammarTitle).toBe('Sử dụng đại từ định lượng "Any" trong câu phủ định');
    expect(result.grammarContent).toContain('Câu này có chứa từ "not"');
  });

  it('extracts words with synonyms from section #4', () => {
    const result = parseGrammarInput(sampleWithHash);
    expect(result.words).toHaveLength(3);

    const authorize = result.words[0];
    expect(authorize.english).toBe('Authorize');
    expect(authorize.partOfSpeech).toBe('v');
    expect(authorize.meaning).toBe('Cho phép, cấp phép, ủy quyền');
    expect(authorize.synonyms).toEqual(['Approve', 'Permit', 'Allow', 'Sanction']);
  });

  it('works without # prefix', () => {
    const result = parseGrammarInput(sampleWithoutHash);
    expect(result.grammarTitle).toBe('Sử dụng "Any" trong câu phủ định');
    expect(result.grammarContent).toContain('Câu có chứa từ "not"');
    expect(result.words).toHaveLength(2);
    expect(result.words[0].english).toBe('Authorize');
    expect(result.words[1].english).toBe('Finalized');
  });

  it('returns empty results for empty input', () => {
    const result = parseGrammarInput('');
    expect(result.grammarTitle).toBe('');
    expect(result.grammarContent).toBe('');
    expect(result.words).toEqual([]);
  });

  it('handles missing sections gracefully', () => {
    const result = parseGrammarInput('1. Dịch nghĩa\nSome text here');
    expect(result.grammarTitle).toBe('');
    expect(result.words).toEqual([]);
  });
});
