
import { Point } from './types.ts';

// Promisified image loader
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

// Calculates bounding box for a path or multiple paths
export const getBoundingBox = (points: Point[], extraStrokes: Point[][] = []) => {
  if (points.length === 0 && extraStrokes.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  const processPoint = (p: Point) => {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  };

  points.forEach(processPoint);
  extraStrokes.forEach(stroke => stroke.forEach(processPoint));

  if (minX === Infinity) return null; // Safety check

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

// Strips data URI header
export const cleanBase64 = (data: string) => data.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

// Resizes image for API limits
export const resizeImageForApi = async (base64Str: string, maxDim = 1024): Promise<string> => {
  const img = await loadImage(base64Str);
  let w = img.width, h = img.height;
  if (w > maxDim || h > maxDim) {
    if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
    else { w = Math.round((w * maxDim) / h); h = maxDim; }
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.8);
};

// Applies a B&W mask to an image to create transparency
export const applyMaskToImage = async (originalSrc: string, maskSrc: string): Promise<string> => {
  const [original, mask] = await Promise.all([loadImage(originalSrc), loadImage(maskSrc)]);
  const width = original.width, height = original.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width; maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d')!;
  
  // 1. Convert B&W mask to Alpha
  maskCtx.drawImage(mask, 0, 0, width, height);
  const maskData = maskCtx.getImageData(0, 0, width, height);
  const d = maskData.data;
  for (let i = 0; i < d.length; i += 4) {
      const luminance = (d[i] + d[i+1] + d[i+2]) / 3;
      d[i+3] = luminance > 128 ? 255 : 0; // Black -> Transparent, White -> Opaque
  }
  maskCtx.putImageData(maskData, 0, 0);

  // 2. Composite original with the new alpha mask
  ctx.drawImage(original, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  
  return canvas.toDataURL('image/png');
};
