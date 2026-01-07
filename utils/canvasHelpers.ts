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

  // Ghostly Red Mask (Low opacity to let AI see edges)
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
 * Enhanced Alpha Mask Application with Erosion.
 * Physically shrinks the mask by 1-2 pixels to remove white edge halos.
 */
export const applyMaskToImage = async (originalSrc: string, maskSrc: string): Promise<string> => {
  const [original, mask] = await Promise.all([
    loadImage(originalSrc),
    loadImage(maskSrc)
  ]);
  
  const width = original.width;
  const height = original.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context failed");
  
  // 1. Prepare Mask Canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error("Mask Context failed");

  // Draw raw mask (AI returns White Object / Black Background, fully opaque)
  maskCtx.drawImage(mask, 0, 0, width, height);
  
  const maskImageData = maskCtx.getImageData(0, 0, width, height);
  const data = maskImageData.data;

  // 2. CONVERT BLACK TO TRANSPARENT
  // Crucial Step: The AI mask is opaque. We must map Black -> Transparent Alpha.
  const threshold = 100; // Brightness threshold
  for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg < threshold) {
          data[i + 3] = 0; // Transparent
      } else {
          data[i + 3] = 255; // Fully Opaque
          // Enforce pure white for cleaner processing
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
      }
  }

  // 3. MASK EROSION (Shrink the opaque area)
  // This removes the edge pixels to kill halos.
  const iterations = 2; 

  for (let k = 0; k < iterations; k++) {
    const sourceData = new Uint8ClampedArray(data); // Snapshot of current state
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // If current pixel is Opaque
        if (sourceData[idx + 3] > 0) {
          let shouldErode = false;
          
          // Check neighbors. If any neighbor is transparent, this pixel is on the edge -> erode it.
          // Top
          if (y > 0 && sourceData[idx - width * 4 + 3] === 0) shouldErode = true;
          // Bottom
          else if (y < height - 1 && sourceData[idx + width * 4 + 3] === 0) shouldErode = true;
          // Left
          else if (x > 0 && sourceData[idx - 4 + 3] === 0) shouldErode = true;
          // Right
          else if (x < width - 1 && sourceData[idx + 4 + 3] === 0) shouldErode = true;

          if (shouldErode) {
            data[idx + 3] = 0; // Set to transparent
          }
        }
      }
    }
  }

  maskCtx.putImageData(maskImageData, 0, 0);

  // 4. Slight Blur to soften the jagged eroded edge
  const smoothCanvas = document.createElement('canvas');
  smoothCanvas.width = width;
  smoothCanvas.height = height;
  const smoothCtx = smoothCanvas.getContext('2d');
  
  if (smoothCtx) {
    // Apply a tiny blur to the alpha channel to make the cutout look natural, not pixelated
    smoothCtx.filter = 'blur(1.5px)'; 
    smoothCtx.drawImage(maskCanvas, 0, 0);
    
    // Clear the mask context and draw the smoothed version back
    maskCtx.clearRect(0, 0, width, height);
    maskCtx.drawImage(smoothCanvas, 0, 0);
  }

  // 5. Composite
  ctx.drawImage(original, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  
  return canvas.toDataURL('image/png');
};