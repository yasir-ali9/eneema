import { Point, Size } from '../types';

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

export const getBoundingBox = (points: Point[]): { x: number; y: number; width: number; height: number } | null => {
  if (points.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const cleanBase64 = (data: string) => {
  return data.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
};

export const resizeImageForApi = async (base64Str: string, maxDimension = 1024): Promise<string> => {
  const img = await loadImage(base64Str);
  
  let width = img.width;
  let height = img.height;
  
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context failed");
  
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.8);
};

export const createCroppedSelection = async (
  src: string, 
  lassoPoints: Point[], 
  originalWidth: number,
  originalHeight: number,
  padding: number = 120
): Promise<string> => {
  const img = await loadImage(src);
  const bbox = getBoundingBox(lassoPoints);
  
  if (!bbox) return src; 

  const scaleX = img.width / originalWidth;
  const scaleY = img.height / originalHeight;

  const cropX = Math.max(0, (bbox.x - padding) * scaleX);
  const cropY = Math.max(0, (bbox.y - padding) * scaleY);
  const cropW = Math.min(img.width - cropX, (bbox.width + padding * 2) * scaleX);
  const cropH = Math.min(img.height - cropY, (bbox.height + padding * 2) * scaleY);

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context failed");

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Ghostly Red Mask (Lower opacity so AI can see the object BETTER underneath)
  ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
  ctx.beginPath();
  if (lassoPoints.length > 0) {
      ctx.moveTo((lassoPoints[0].x * scaleX) - cropX, (lassoPoints[0].y * scaleY) - cropY);
      for(let i=1; i<lassoPoints.length; i++) {
          ctx.lineTo((lassoPoints[i].x * scaleX) - cropX, (lassoPoints[i].y * scaleY) - cropY);
      }
      ctx.closePath();
      ctx.fill();
      
      // Thin guideline stroke
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
  }

  return canvas.toDataURL('image/jpeg', 0.8);
};

/**
 * Enhanced Alpha Mask Application.
 * Includes a "Thresholding" step to prevent the AI's "messy" output from creating halos.
 */
export const applyMaskToImage = async (originalSrc: string, maskSrc: string): Promise<string> => {
  const [original, mask] = await Promise.all([
    loadImage(originalSrc),
    loadImage(maskSrc)
  ]);
  
  const canvas = document.createElement('canvas');
  canvas.width = original.width;
  canvas.height = original.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context failed");
  
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = original.width;
  maskCanvas.height = original.height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error("Mask Context failed");

  maskCtx.drawImage(mask, 0, 0, original.width, original.height);
  
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const data = maskData.data;
  
  /**
   * MASK CLEANING:
   * The AI sometimes returns a gray "halo" around the white object.
   * We apply a threshold: if it's not bright enough, it's transparent.
   */
  for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      // THRESHOLD: Any pixel with less than 50% brightness becomes fully transparent.
      // This kills the "messy selection" artifacts.
      if (brightness < 128) {
          data[i + 3] = 0;
      } else {
          // Map brightness to alpha for soft anti-aliasing on the edges
          data[i + 3] = brightness; 
      }
  }
  maskCtx.putImageData(maskData, 0, 0);

  // 1. Draw the clean object
  ctx.drawImage(original, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  
  return canvas.toDataURL('image/png');
};