export type AvatarLayerState = {
  head: { x: number; y: number; scale: number };
  face: { x: number; y: number; scale: number };
  mouth: { x: number; y: number; scale: number };
  blink: { x: number; y: number; scale: number };
  leftEye: { x: number; y: number; scale: number };
  rightEye: { x: number; y: number; scale: number };
  leftPupil: { x: number; y: number; scale: number };
  rightPupil: { x: number; y: number; scale: number };
  leftBrow: { x: number; y: number; scale: number };
  rightBrow: { x: number; y: number; scale: number };
};

export const DEFAULT_AVATAR_LAYERS: AvatarLayerState = {
  head: { x: 20.399993896484375, y: -374.6000061035156, scale: 1.11 },
  face: { x: 14.199996948242188, y: -267.0000305175781, scale: 1.0 },
  mouth: { x: -51.800079345703125, y: -210.1999969482422, scale: 0.2 },
  blink: { x: -45.20021057128906, y: -72.99998474121094, scale: 0.35 },
  leftEye: { x: 54.40008544921875, y: -12.600067138671875, scale: 1.0 },
  rightEye: { x: -149.79998779296875, y: -18.199951171875, scale: 1.0 },
  leftPupil: { x: 55.000091552734375, y: -8.599945068359375, scale: 0.68 },
  rightPupil: { x: -147.5999755859375, y: -12.600006103515625, scale: 0.68 },
  leftBrow: { x: -45.39996337890625, y: -8.60003662109375, scale: 1.5 },
  rightBrow: { x: -47.19989013671875, y: -6.000030517578125, scale: 1.51 },
};
