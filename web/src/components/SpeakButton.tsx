interface Props {
  text: string;
}

export default function SpeakButton({ text }: Props) {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    !window.SpeechSynthesisUtterance
  ) {
    return null;
  }
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };
  return (
    <button
      type="button"
      onClick={speak}
      aria-label={`Phát âm ${text}`}
      className="rounded px-1 hover:bg-gray-100"
    >
      🔊
    </button>
  );
}