import { Point } from '../../../core/types.ts';

// Loads image from URL
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

// Gets bounding box of path
export const getBoundingBox = (points: Point[]) => {
  if (points.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(p => {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

// Strips base64 headers
export const cleanBase64 = (data: string) => data.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

// Resizes image for Gemini API
export const resizeImageForApi = async (base64Str: string, maxDim = 1024): Promise<string> => {
  const img = await loadImage(base64Str);
  let w = img.width, h = img.height;
  if (w > maxDim || h > maxDim) {
    if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
    else { w = Math.round((w * maxDim) / h); h = maxDim; }
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.8);
};

// Generates cropped focus for AI
export const createCroppedSelection = async (src: string, lassoPoints: Point[], origW: number, origH: number, padding: number = 120): Promise<string> => {
  const img = await loadImage(src);
  const bbox = getBoundingBox(lassoPoints);
  if (!bbox) return src; 
  const scaleX = img.width / origW, scaleY = img.height / origH;
  const cropX = Math.max(0, (bbox.x - padding) * scaleX), cropY = Math.max(0, (bbox.y - padding) * scaleY);
  const cropW = Math.min(img.width - cropX, (bbox.width + padding * 2) * scaleX), cropH = Math.min(img.height - cropY, (bbox.height + padding * 2) * scaleY);
  const canvas = document.createElement('canvas');
  canvas.width = cropW; canvas.height = cropH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
  ctx.beginPath();
  if (lassoPoints.length > 0) {
      ctx.moveTo((lassoPoints[0].x * scaleX) - cropX, (lassoPoints[0].y * scaleY) - cropY);
      for(let i=1; i<lassoPoints.length; i++) ctx.lineTo((lassoPoints[i].x * scaleX) - cropX, (lassoPoints[i].y * scaleY) - cropY);
      ctx.closePath(); ctx.fill();
  }
  return canvas.toDataURL('image/jpeg', 0.8);
};

// Applies mask with erosion
export const applyMaskToImage = async (originalSrc: string, maskSrc: string): Promise<string> => {
  const [original, mask] = await Promise.all([loadImage(originalSrc), loadImage(maskSrc)]);
  const width = original.width, height = original.height;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width; maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d')!;
  maskCtx.drawImage(mask, 0, 0, width, height);
  const maskImageData = maskCtx.getImageData(0, 0, width, height);
  const data = maskImageData.data;

  for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i+1] + data[i+2]) / 3;
      data[i+3] = avg < 100 ? 0 : 255; 
      data[i] = 255; data[i+1] = 255; data[i+2] = 255;
  }

  // Edge refinement
  for (let k = 0; k < 2; k++) {
    const snapshot = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (snapshot[idx + 3] > 0) {
          if (snapshot[idx-4+3] === 0 || snapshot[idx+4+3] === 0 || snapshot[idx-(width*4)+3] === 0 || snapshot[idx+(width*4)+3] === 0) {
            data[idx + 3] = 0;
          }
        }
      }
    }
  }
  maskCtx.putImageData(maskImageData, 0, 0);

  ctx.drawImage(original, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  return canvas.toDataURL('image/png');
};