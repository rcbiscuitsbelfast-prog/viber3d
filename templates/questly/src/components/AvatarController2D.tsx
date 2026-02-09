import { useEffect, useMemo, useRef, useState } from 'react';
import { resolvePath } from '@/utils/assetPath';

const DRUID_ASSET_BASE = '/Assets/druid folder maybenew/';

const assetUrl = (fileName: string) => {
  // resolvePath handles encoding of path segments with spaces automatically
  // Just concatenate the base path and filename
  return resolvePath(`${DRUID_ASSET_BASE}${fileName}`);
};

type AvatarMode = 'idle' | 'talk';

type LayerTransform = {
  x: number;
  y: number;
  scale: number;
};

type AvatarPart =
  | 'head'
  | 'face'
  | 'mouth'
  | 'blink'
  | 'leftEye'
  | 'rightEye'
  | 'leftPupil'
  | 'rightPupil'
  | 'leftBrow'
  | 'rightBrow';

interface AvatarController2DProps {
  mode?: AvatarMode;
  size?: number;
  className?: string;
  enablePupilTracking?: boolean;
  headTransform?: LayerTransform;
  faceTransform?: LayerTransform;
  mouthTransform?: LayerTransform;
  blinkTransform?: LayerTransform;
  leftEyeTransform?: LayerTransform;
  rightEyeTransform?: LayerTransform;
  leftPupilTransform?: LayerTransform;
  rightPupilTransform?: LayerTransform;
  leftBrowTransform?: LayerTransform;
  rightBrowTransform?: LayerTransform;
  expressionIntensity?: number;
  selectedPart?: AvatarPart | null;
  onPartPointerDown?: (part: AvatarPart, event: React.PointerEvent<HTMLDivElement>) => void;
  hideEyesOnSelect?: boolean;
  forceMouthOpen?: boolean;
  forceBlinkVisible?: boolean;
  headOnlyMode?: boolean;
}

export default function AvatarController2D({
  mode = 'idle',
  size = 140,
  className = '',
  enablePupilTracking = true,
  headTransform = { x: 0, y: 0, scale: 1 },
  faceTransform = { x: 0, y: 0, scale: 1 },
  mouthTransform = { x: 0, y: 0, scale: 1 },
  blinkTransform = { x: 0, y: 0, scale: 1 },
  leftEyeTransform = { x: 0, y: 0, scale: 1 },
  rightEyeTransform = { x: 0, y: 0, scale: 1 },
  leftPupilTransform = { x: 0, y: 0, scale: 1 },
  rightPupilTransform = { x: 0, y: 0, scale: 1 },
  leftBrowTransform = { x: 0, y: 0, scale: 1 },
  rightBrowTransform = { x: 0, y: 0, scale: 1 },
  expressionIntensity = 1,
  selectedPart = null,
  onPartPointerDown,
  hideEyesOnSelect = false,
  forceMouthOpen = false,
  forceBlinkVisible = false,
  headOnlyMode = false,
}: AvatarController2DProps) {
  // Scale factor: defaults are calibrated for 520px base size
  const BASE_SCALE_SIZE = 520;
  const scaleFactor = size / BASE_SCALE_SIZE;
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const shouldHideEyes = hideEyesOnSelect && Boolean(selectedPart);
  const shouldShowMouth = forceMouthOpen || (mode === 'talk' && isMouthOpen);
  const shouldShowBlink = forceBlinkVisible || !shouldHideEyes || selectedPart === 'blink';

  const wrapperClassName = useMemo(() => {
    const base = 'relative select-none questly-avatar-idle';
    return `${base} ${className}`.trim();
  }, [className]);

  useEffect(() => {
    if (mode !== 'talk') {
      setIsMouthOpen(false);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setIsMouthOpen((prev) => !prev);
    }, 180);

    return () => window.clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (!enablePupilTracking) return undefined;

    let frame = 0;
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const maxOffset = 4;
        const distance = Math.hypot(dx, dy) || 1;
        const scale = Math.min(maxOffset, distance) / distance;
        setPupilOffset({ x: dx * scale, y: dy * scale });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [enablePupilTracking]);

  return (
    <div
      ref={containerRef}
      className={`${wrapperClassName} cursor-pointer`}
      style={{ width: size, height: size, ['--expressive-intensity' as any]: expressionIntensity }}
      onPointerDown={(event) => {
        // Trigger callback for any click on the avatar (not on a specific part)
        if ((event.target as HTMLElement).classList.contains('questly-avatar-idle')) {
          event.stopPropagation();
          onPartPointerDown?.('head', event);
        }
      }}
    >
      {!headOnlyMode && (
        <img
          src={assetUrl('body.png')}
          alt="Druid body"
          className="absolute inset-0 w-full h-full object-contain z-0"
          draggable={false}
        />
      )}
      <div
        className={`absolute inset-0 z-10 ${selectedPart === 'head' ? 'ring-2 ring-emerald-400/70 rounded-lg' : ''}`}
        style={{ transform: `translate(${headTransform.x * scaleFactor}px, ${headTransform.y * scaleFactor}px) scale(${headTransform.scale})` }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPartPointerDown?.('head', event);
        }}
      >
        <img
          src={assetUrl('head.png')}
          alt="Druid head"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
      <div
        className={`absolute inset-0 z-20 ${selectedPart === 'face' ? 'ring-2 ring-sky-400/70 rounded-lg' : ''}`}
        style={{ transform: `translate(${faceTransform.x * scaleFactor}px, ${faceTransform.y * scaleFactor}px) scale(${faceTransform.scale})` }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPartPointerDown?.('face', event);
        }}
      >
        {!shouldHideEyes && (
          <>
            <div
              className={`absolute left-[33%] top-[32%] w-[12%] ${selectedPart === 'leftEye' ? 'ring-2 ring-cyan-400/70 rounded' : ''}`}
              style={{ transform: `translate(${leftEyeTransform.x * scaleFactor}px, ${leftEyeTransform.y * scaleFactor}px) scale(${leftEyeTransform.scale})` }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onPartPointerDown?.('leftEye', event);
              }}
            >
              <img
                src={assetUrl('eyeball (left).png')}
                alt="Left eye"
                className="w-full object-contain"
                draggable={false}
              />
            </div>
            <div
              className={`absolute left-[55%] top-[32%] w-[12%] ${selectedPart === 'rightEye' ? 'ring-2 ring-cyan-400/70 rounded' : ''}`}
              style={{ transform: `translate(${rightEyeTransform.x * scaleFactor}px, ${rightEyeTransform.y * scaleFactor}px) scale(${rightEyeTransform.scale})` }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onPartPointerDown?.('rightEye', event);
              }}
            >
              <img
                src={assetUrl('eyeball (right).png')}
                alt="Right eye"
                className="w-full object-contain"
                draggable={false}
              />
            </div>
            <div
              className={`absolute left-[33%] top-[32%] w-[12%] ${selectedPart === 'leftPupil' ? 'ring-2 ring-indigo-400/70 rounded' : ''}`}
              style={{ transform: `translate(${(leftPupilTransform.x + pupilOffset.x) * scaleFactor}px, ${(leftPupilTransform.y + pupilOffset.y) * scaleFactor}px) scale(${leftPupilTransform.scale})` }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onPartPointerDown?.('leftPupil', event);
              }}
            >
              <img
                src={assetUrl('pupil (left).png')}
                alt="Left pupil"
                className="w-full object-contain"
                draggable={false}
              />
            </div>
            <div
              className={`absolute left-[55%] top-[32%] w-[12%] ${selectedPart === 'rightPupil' ? 'ring-2 ring-indigo-400/70 rounded' : ''}`}
              style={{ transform: `translate(${(rightPupilTransform.x + pupilOffset.x) * scaleFactor}px, ${(rightPupilTransform.y + pupilOffset.y) * scaleFactor}px) scale(${rightPupilTransform.scale})` }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onPartPointerDown?.('rightPupil', event);
              }}
            >
              <img
                src={assetUrl('pupil (right).png')}
                alt="Right pupil"
                className="w-full object-contain"
                draggable={false}
              />
            </div>
          </>
        )}
        {shouldShowBlink && (
          <div
            className={`absolute inset-0 ${selectedPart === 'blink' ? 'ring-2 ring-violet-400/70 rounded' : ''}`}
            style={{ transform: `translate(${blinkTransform.x * scaleFactor}px, ${blinkTransform.y * scaleFactor}px) scale(${blinkTransform.scale})` }}
            onPointerDown={(event) => {
              event.stopPropagation();
              onPartPointerDown?.('blink', event);
            }}
          >
            <img
              src={assetUrl('blink eyes.png')}
              alt="Blink"
              className={`w-full h-full object-contain ${forceBlinkVisible ? '' : 'questly-avatar-blink'}`}
              draggable={false}
            />
          </div>
        )}
        {/* Eyebrows render LAST to always be on top */}
        <div className={`absolute inset-0 ${mode === 'talk' ? 'questly-avatar-expressive' : ''}`}>
          <div
            className={`absolute left-[33%] top-[26%] w-[12%] ${selectedPart === 'leftBrow' ? 'ring-2 ring-fuchsia-400/70 rounded' : ''}`}
            style={{ transform: `translate(${leftBrowTransform.x * scaleFactor}px, ${leftBrowTransform.y * scaleFactor}px) scale(${leftBrowTransform.scale})` }}
            onPointerDown={(event) => {
              event.stopPropagation();
              onPartPointerDown?.('leftBrow', event);
            }}
          >
            <img
              src={assetUrl('eyebrow left.png')}
              alt="Left eyebrow"
              className="w-full object-contain"
              draggable={false}
            />
          </div>
          <div
            className={`absolute left-[55%] top-[26%] w-[12%] ${selectedPart === 'rightBrow' ? 'ring-2 ring-fuchsia-400/70 rounded' : ''}`}
            style={{ transform: `translate(${rightBrowTransform.x * scaleFactor}px, ${rightBrowTransform.y * scaleFactor}px) scale(${rightBrowTransform.scale})` }}
            onPointerDown={(event) => {
              event.stopPropagation();
              onPartPointerDown?.('rightBrow', event);
            }}
          >
            <img
              src={assetUrl('eyebrow right.png')}
              alt="Right eyebrow"
              className="w-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      </div>
      <div
        className={`absolute inset-0 z-30 ${selectedPart === 'mouth' ? 'ring-2 ring-amber-400/70 rounded-lg' : ''}`}
        style={{ transform: `translate(${mouthTransform.x * scaleFactor}px, ${mouthTransform.y * scaleFactor}px) scale(${mouthTransform.scale})` }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPartPointerDown?.('mouth', event);
        }}
      >
        {shouldShowMouth && (
          <img
            src={assetUrl('mouth open.png')}
            alt="Mouth open"
            className="w-full h-full object-contain"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
