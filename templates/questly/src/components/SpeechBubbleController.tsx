import { useEffect, useState, CSSProperties } from 'react';

interface SpeechBubbleControllerProps {
  text?: string;
  visible: boolean;
  durationMs?: number;
  className?: string;
  style?: CSSProperties;
  onHide?: () => void;
}

export default function SpeechBubbleController({
  text,
  visible,
  durationMs = 2500,
  className = '',
  style,
  onHide,
}: SpeechBubbleControllerProps) {
  const [rendered, setRendered] = useState(visible);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (!visible) return undefined;

    setRendered(true);
    setIsVisible(true);

    const timeout = window.setTimeout(() => {
      setIsVisible(false);
    }, durationMs);

    return () => window.clearTimeout(timeout);
  }, [durationMs, visible]);

  useEffect(() => {
    if (!rendered || isVisible) return undefined;

    const timeout = window.setTimeout(() => {
      setRendered(false);
      onHide?.();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isVisible, onHide, rendered]);

  if (!rendered || !text) return null;

  return (
    <div
      className={`questly-speech-bubble transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${className}`.trim()}
      style={style}
    >
      <div className="bg-slate-900 text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg border border-slate-700 min-w-[250px] max-w-[90vw] sm:max-w-[400px]">
        {text}
      </div>
    </div>
  );
}
