export interface ParsedWord {
  english: string;
  partOfSpeech: string;
  meaning: string;
  synonyms: string[];
}

export interface ParseResult {
  grammarTitle: string;
  grammarContent: string;
  words: ParsedWord[];
}

function splitSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split('\n');
  let currentKey = '';
  const currentLines: string[] = [];

  const sectionPatterns: [string, RegExp][] = [
    ['1', /^#?1[\.\)]:?\s*Dịch nghĩa/i],
    ['2', /^#?2[\.\)]:?\s*Đáp án/i],
    ['3', /^#?3[\.\)]:?\s*Giải thích/i],
    ['4', /^#?4[\.\)]:?\s*Từ vựng/i],
  ];

  for (const line of lines) {
    let matched = false;
    for (const [key, pattern] of sectionPatterns) {
      if (pattern.test(line)) {
        if (currentKey) sections[currentKey] = currentLines.join('\n').trim();
        currentKey = key;
        currentLines.length = 0;
        matched = true;
        break;
      }
    }
    if (!matched) {
      currentLines.push(line);
    }
  }
  if (currentKey) sections[currentKey] = currentLines.join('\n').trim();
  return sections;
}

function parseGrammarSection(raw: string): { title: string; content: string } {
  const lines = raw.split('\n');
  let title = '';
  const contentLines: string[] = [];

  for (const line of lines) {
    const titleMatch = line.match(/^Tiêu đề:\s*(.+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }
    if (title) {
      contentLines.push(line);
    }
  }

  return { title, content: contentLines.join('\n').trim() };
}

function parseWordsSection(raw: string): ParsedWord[] {
  const words: ParsedWord[] = [];
  const lines = raw.split('\n');
  let current: Partial<ParsedWord> | null = null;

  for (const line of lines) {
    const wordMatch = line.match(/^(.+?)\s+\((\w+)\):\s*(.+)/);
    if (wordMatch) {
      if (current?.english) {
        words.push(current as ParsedWord);
      }
      current = {
        english: wordMatch[1],
        partOfSpeech: wordMatch[2],
        meaning: wordMatch[3].trim(),
        synonyms: [],
      };
      continue;
    }

    const synMatch = line.match(/^Từ đồng nghĩa:\s*(.+)/);
    if (synMatch && current) {
      const raw = synMatch[1]
        .replace(/\.$/, '')
        .split(/[,;]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      current.synonyms = raw;
    }
  }

  if (current?.english) {
    words.push(current as ParsedWord);
  }

  return words;
}

export function parseGrammarInput(text: string): ParseResult {
  const sections = splitSections(text);

  const { title, content } = parseGrammarSection(sections['3'] ?? '');
  const words = parseWordsSection(sections['4'] ?? '');

  return { grammarTitle: title, grammarContent: content, words };
}
