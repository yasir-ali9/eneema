import { GEMINI_IMAGE_MODEL, GEMINI_REASONING_MODEL } from '../../core/constants.ts';
import { cleanBase64, resizeImageForApi } from '../../central/canvas/helpers/canvas.utils.ts';
import { ProcessedImageResult } from '../../core/types.ts';
import { ai } from '../../services/gemini.client.ts';
import { applyMaskToImage } from './detach.utils.ts';

/**
 * AI object extraction pipeline.
 */
export const detachObjectWithGemini = async (
  imageBase64: string, // The original clean source
  fullContextBase64: string, // The full image with user's red highlight
  croppedContextBase64: string // The zoomed-in red highlight for reasoning
): Promise<ProcessedImageResult> => {
  try {
    // Standardize inputs for API limits
    const rawCleanFull = cleanBase64(await resizeImageForApi(imageBase64, 1024));
    const rawHighlightedFull = cleanBase64(await resizeImageForApi(fullContextBase64, 1024));
    const rawCroppedContext = cleanBase64(croppedContextBase64);

    // Phase 1: Reasoning
    const reasoningResponse = await ai.models.generateContent({
      model: GEMINI_REASONING_MODEL,
      contents: {
        parts: [
          { text: "Identify the object within the red highlight. Return only a short label in JSON: {\"label\": \"name\"}" },
          { inlineData: { mimeType: 'image/jpeg', data: rawCroppedContext } }
        ]
      }
    });

    let sceneInfo = { label: "object" };
    try {
        const text = reasoningResponse.text?.replace(/```json|```/g, '').trim() || "{}";
        const match = text.match(/\{.*\}/s);
        if (match) sceneInfo = JSON.parse(match[0]);
    } catch (e) { console.warn("Reasoning failed, defaulting to generic object"); }

    // Phase 2: Masking & Inpainting
    const maskPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Generate a high-precision binary mask for the ${sceneInfo.label}. Use the red highlight in the second image as your selection guide, but use the first image for pixel-perfect edges. White = Object, Black = Background. Ensure no parts of the object are cut off.` },
          { inlineData: { mimeType: 'image/jpeg', data: rawCleanFull } },
          { inlineData: { mimeType: 'image/jpeg', data: rawHighlightedFull } }
        ]
      }
    });

    const fillPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Inpaint the background perfectly removing the ${sceneInfo.label} identified in the red highlight. Reconstruct any hidden textures.` },
          { inlineData: { mimeType: 'image/jpeg', data: rawHighlightedFull } }
        ]
      }
    });

    const [maskRes, fillRes] = await Promise.all([maskPromise, fillPromise]);

    let maskData = null, bgData = null;
    maskRes.candidates?.[0]?.content?.parts.forEach(p => { 
        if (p.inlineData) maskData = `data:image/png;base64,${p.inlineData.data}`; 
    });
    fillRes.candidates?.[0]?.content?.parts.forEach(p => { 
        if (p.inlineData) bgData = `data:image/png;base64,${p.inlineData.data}`; 
    });

    // Phase 3: Post-processing
    let objData = null;
    if (maskData) {
        objData = await applyMaskToImage(imageBase64, maskData);
    }

    return { object: objData, background: bgData, label: sceneInfo.label };
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};
