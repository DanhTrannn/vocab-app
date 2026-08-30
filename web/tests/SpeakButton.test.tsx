import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SpeakButton from '../src/components/SpeakButton';

const speakSpy = vi.fn();

class FakeUtterance {
  lang = '';
  rate = 1;
  constructor(public text: string) {}
}

function stubSpeechSupport(supported: boolean) {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: supported ? { cancel: vi.fn(), speak: speakSpy } : undefined,
  });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: FakeUtterance,
  });
}

afterEach(() => {
  cleanup();
  speakSpy.mockClear();
  Reflect.deleteProperty(window, 'speechSynthesis');
  Reflect.deleteProperty(window, 'SpeechSynthesisUtterance');
});

describe('SpeakButton', () => {
  it('ẩn khi trình duyệt không hỗ trợ', () => {
    stubSpeechSupport(false);
    const { container } = render(<SpeakButton text="happy" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('click → đọc từ với lang en-US, rate 0.9', () => {
    stubSpeechSupport(true);
    render(<SpeakButton text="happy" />);
    fireEvent.click(screen.getByRole('button', { name: 'Phát âm happy' }));
    expect(speakSpy).toHaveBeenCalledTimes(1);
    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.rate).toBe(0.9);
    expect(utterance.text).toBe('happy');
  });
});