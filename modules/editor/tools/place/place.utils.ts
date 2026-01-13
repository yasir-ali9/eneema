import { EditorNode } from '../../core/types.ts';
import { loadImage } from '../../central/canvas/helpers/canvas.utils.ts';

/**
 * Creates a composite image (Background + Foreground) and a Mask image (Foreground Alpha).
 * This prepares the "Collage" for the AI to process.
 */
export const createCompositeAndMask = async (bgNode: EditorNode, fgNode: EditorNode, dilate: boolean = true): Promise<{ composite: string, mask: string }> => {
  const [bgImg, fgImg] = await Promise.all([loadImage(bgNode.src), loadImage(fgNode.src)]);
  
  const canvas = document.createElement('canvas');
  canvas.width = bgImg.width;
  canvas.height = bgImg.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(bgImg, 0, 0);

  // Calculate FG position relative to BG
  const relativeX = (fgNode.x - bgNode.x) * (bgImg.width / bgNode.width);
  const relativeY = (fgNode.y - bgNode.y) * (bgImg.height / bgNode.height);
  const relativeW = fgNode.width * (bgImg.width / bgNode.width);
  const relativeH = fgNode.height * (bgImg.height / bgNode.height);

  ctx.save();
  ctx.translate(relativeX + relativeW / 2, relativeY + relativeH / 2);
  ctx.rotate((fgNode.rotation * Math.PI) / 180);
  ctx.translate(-relativeW / 2, -relativeH / 2);
  ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
  ctx.restore();

  const compositeData = canvas.toDataURL('image/jpeg', 0.9);

  // Create Mask
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(relativeX + relativeW / 2, relativeY + relativeH / 2);
  ctx.rotate((fgNode.rotation * Math.PI) / 180);
  ctx.translate(-relativeW / 2, -relativeH / 2);

  if (dilate) {
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 50; 
      ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
      ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
      ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);
      ctx.shadowBlur = 0;
  }

  ctx.drawImage(fgImg, 0, 0, relativeW, relativeH);

  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const maskData = canvas.toDataURL('image/png');

  return { composite: compositeData, mask: maskData };
};
