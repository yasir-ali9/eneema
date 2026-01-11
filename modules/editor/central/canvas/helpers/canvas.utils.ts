import { Point, EditorNode } from '../../../core/types.ts';

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
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(img, 0, 0, w, h);
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
 * Production-ready version includes noise thresholding and alpha stabilization.
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

  // Professional Thresholding: 
  // Models often return dark gray (e.g. RGB 20,20,20) for background areas.
  // This loop kills that noise while preserving the solid object.
  for (let i = 0; i < data.length; i += 4) {
      const luminance = (data[i] + data[i+1] + data[i+2]) / 3;
      
      let alpha = 0;
      if (luminance > 30) {
          // Linear ramp for anti-aliasing but thresholded at 30 to kill noise
          alpha = Math.min(255, (luminance - 30) * 1.2);
          // If it's bright enough, make it fully opaque to avoid "cutting" into the object
          if (luminance > 220) alpha = 255;
      }
      
      data[i+3] = alpha; 
      // Normalize base color to white for the masking operation
      data[i] = 255; data[i+1] = 255; data[i+2] = 255;
  }

  maskCtx.putImageData(maskImageData, 0, 0);

  // Use destination-in to cut the original image with the processed alpha mask
  ctx.drawImage(original, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  
  return canvas.toDataURL('image/png');
};

/**
 * Scans the image for non-transparent pixels and returns a cropped version.
 * Returns the cropped base64 string and the relative offset/dimensions.
 * Optimized with directional scanning to avoid checking every single pixel if possible.
 * Includes a padding buffer to prevent tight cropping.
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

  // Scan for minY (Top to Bottom)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        minY = y;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  
  if (!found) return null; // Totally transparent image

  // Scan for maxY (Bottom to Top)
  found = false;
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        maxY = y;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // Scan for minX (Left to Right, limited by Y bounds)
  found = false;
  for (let x = 0; x < w; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        minX = x;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // Scan for maxX (Right to Left, limited by Y bounds)
  found = false;
  for (let x = w - 1; x >= 0; x--) {
    for (let y = minY; y <= maxY; y++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        maxX = x;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // Apply padding while staying within image bounds
  const paddedMinX = Math.max(0, minX - padding);
  const paddedMinY = Math.max(0, minY - padding);
  const paddedMaxX = Math.min(w - 1, maxX + padding);
  const paddedMaxY = Math.min(h - 1, maxY + padding);

  const cropW = paddedMaxX - paddedMinX + 1;
  const cropH = paddedMaxY - paddedMinY + 1;

  if (cropW <= 0 || cropH <= 0) return null;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;

  cropCtx.drawImage(canvas, paddedMinX, paddedMinY, cropW, cropH, 0, 0, cropW, cropH);

  return {
    src: cropCanvas.toDataURL('image/png'),
    x: paddedMinX,
    y: paddedMinY,
    width: cropW,
    height: cropH
  };
};

/**
 * Creates a composite image (Background + Foreground) and a Mask image (Foreground Alpha).
 * This prepares the "Collage" for the AI to process.
 * 
 * @param dilate If true, expands the mask by a significant margin (~50px) using shadow blur.
 *               This allows the AI to modify pixels *around* the object for realistic shadows and blending.
 */
export const createCompositeAndMask = async (bgNode: EditorNode, fgNode: EditorNode, dilate: boolean = true): Promise<{ composite: string, mask: string }> => {
  const [bgImg, fgImg] = await Promise.all([loadImage(bgNode.src), loadImage(fgNode.src)]);
  
  // 1. Setup Canvas based on Background Dimensions (The Stage)
  const canvas = document.createElement('canvas');
  canvas.width = bgImg.width;
  canvas.height = bgImg.height;
  const ctx = canvas.getContext('2d')!;

  // 2. Draw Background
  ctx.drawImage(bgImg, 0, 0);

  // 3. Calculate FG position relative to BG
  // Node coordinates are in "Canvas World Space". We need to map FG relative to BG.
  const relativeX = (fgNode.x - bgNode.x) * (bgImg.width / bgNode.width);
  const relativeY = (fgNode.y - bgNode.y) * (bgImg.height / bgNode.height);
  const relativeW = fgNode.width * (bgImg.width / bgNode.width);
  const relativeH = fgNode.height * (bgImg.height / bgNode.height);

  // 4. Draw Foreground (Composite)
  ctx.save();
  // Translate to center of where FG should be
  ctx.translate(relativeX + relativeW / 2, relativeY + relativeH / 2);
  ctx.rotate((fgNode.rotation * Math.PI) / 180);
  ctx.translate(-relativeW / 2, -relativeH / 2);
  ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
  ctx.restore();

  const compositeData = canvas.toDataURL('image/jpeg', 0.9);

  // 5. Create Mask (White FG on Black BG)
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear to Black

  // Draw FG for Mask
  ctx.save();
  ctx.translate(relativeX + relativeW / 2, relativeY + relativeH / 2);
  ctx.rotate((fgNode.rotation * Math.PI) / 180);
  ctx.translate(-relativeW / 2, -relativeH / 2);

  if (dilate) {
      // Create a "glow" around the object to expand the editable area.
      // This allows the AI to generate shadows on the floor/wall behind the object.
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 50; 
      // Draw multiple times to make the soft edge opaque enough for the mask
      ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
      ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
      ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
      ctx.shadowBlur = 0; // Reset
  }

  // Draw the core object solid
  ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);

  // Ensure the shape is filled white (Using source-in to tint non-transparent pixels white)
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Use canvas dims to cover any dilated area
  ctx.restore();

  const maskData = canvas.toDataURL('image/png');

  return { composite: compositeData, mask: maskData };
};