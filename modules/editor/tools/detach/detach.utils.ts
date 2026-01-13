import { Point } from '../../core/types.ts';
import { loadImage, getBoundingBox } from '../../central/canvas/helpers/canvas.utils.ts';

/**
 * Generates a cropped version of the image focused on the lasso selection.
 * Adds a visual "Red Highlight" to help the Reasoning Model identify the object.
 */
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
  
  // High-visibility red highlight for the AI Reasoning model
  ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
  ctx.beginPath();
  if (lassoPoints.length > 0) {
      ctx.moveTo((lassoPoints[0].x * scaleX) - cropX, (lassoPoints[0].y * scaleY) - cropY);
      for(let i=1; i<lassoPoints.length; i++) ctx.lineTo((lassoPoints[i].x * scaleX) - cropX, (lassoPoints[i].y * scaleY) - cropY);
      ctx.closePath(); ctx.fill();
  }
  return canvas.toDataURL('image/jpeg', 0.8);
};

/**
 * Applies a Black and White mask to an image to create transparency.
 */
export const applyMaskToImage = async (originalSrc: string, maskSrc: string): Promise<string> => {
  const [original, mask] = await Promise.all([loadImage(originalSrc), loadImage(maskSrc)]);
  const width = original.width, height = original.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width; maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d')!;
  
  // Draw the raw AI mask
  maskCtx.drawImage(mask, 0, 0, width, height);
  const maskImageData = maskCtx.getImageData(0, 0, width, height);
  const data = maskImageData.data;

  // Professional Thresholding
  for (let i = 0; i < data.length; i += 4) {
      const luminance = (data[i] + data[i+1] + data[i+2]) / 3;
      let alpha = 0;
      if (luminance > 30) {
          alpha = Math.min(255, (luminance - 30) * 1.2);
          if (luminance > 220) alpha = 255;
      }
      data[i+3] = alpha; 
      data[i] = 255; data[i+1] = 255; data[i+2] = 255;
  }

  maskCtx.putImageData(maskImageData, 0, 0);

  ctx.drawImage(original, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  
  return canvas.toDataURL('image/png');
};

/**
 * Scans the image for non-transparent pixels and returns a cropped version.
 */
export const cropTransparentImage = async (src: string, padding: number = 20): Promise<{ src: string, x: number, y: number, width: number, height: number } | null> => {
  const img = await loadImage(src);
  const w = img.width;
  const h = img.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        minY = y; found = true; break;
      }
    }
    if (found) break;
  }
  
  if (!found) return null;

  found = false;
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        maxY = y; found = true; break;
      }
    }
    if (found) break;
  }

  found = false;
  for (let x = 0; x < w; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        minX = x; found = true; break;
      }
    }
    if (found) break;
  }

  found = false;
  for (let x = w - 1; x >= 0; x--) {
    for (let y = minY; y <= maxY; y++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        maxX = x; found = true; break;
      }
    }
    if (found) break;
  }

  const paddedMinX = Math.max(0, minX - padding);
  const paddedMinY = Math.max(0, minY - padding);
  const paddedMaxX = Math.min(w - 1, maxX + padding);
  const paddedMaxY = Math.min(h - 1, maxY + padding);

  const cropW = paddedMaxX - paddedMinX + 1;
  const cropH = paddedMaxY - paddedMinY + 1;

  if (cropW <= 0 || cropH <= 0) return null;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW; cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;

  cropCtx.drawImage(canvas, paddedMinX, paddedMinY, cropW, cropH, 0, 0, cropW, cropH);

  return {
    src: cropCanvas.toDataURL('image/png'),
    x: paddedMinX, y: paddedMinY, width: cropW, height: cropH
  };
};
