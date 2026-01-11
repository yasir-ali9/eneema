import { GoogleGenAI } from "@google/genai";
import { GEMINI_IMAGE_MODEL, GEMINI_REASONING_MODEL } from '../core/constants.ts';
import { cleanBase64, applyMaskToImage, resizeImageForApi } from '../central/canvas/helpers/canvas.utils.ts';
import { ProcessedImageResult } from '../core/types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AI object extraction pipeline.
 * Refined to provide dual-image context for superior edge detection.
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

    // Phase 1: Reasoning - Identify exactly what the user selected
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

    // Phase 2: Masking & Inpainting - Run in parallel for speed
    // We send both the highlighted image (as a reference) and the clean image (for the actual mask)
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

    // Phase 3: Post-processing - Apply the alpha mask to the high-res original
    let objData = null;
    if (maskData) {
        // applyMaskToImage now includes thresholding to prevent the "background blob" issue
        objData = await applyMaskToImage(imageBase64, maskData);
    }

    return { object: objData, background: bgData, label: sceneInfo.label };
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

/**
 * Intelligent "Place" Tool.
 * Takes a composite image and a dilated mask.
 * Uses Gemini 3 Pro Image to REGENERATE the object within the masked area
 * to match the scene's physics, lighting, and camera properties.
 */
export const placeObjectWithGemini = async (
  compositeBase64: string,
  maskBase64: string
): Promise<string> => {
  try {
    const rawComposite = cleanBase64(await resizeImageForApi(compositeBase64, 1024));
    const rawMask = cleanBase64(await resizeImageForApi(maskBase64, 1024));

    // We use the High-Quality model for editing.
    // The prompt is engineered to allow the model to "fix" the pasted look by regenerating pixels.
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: "You are an expert photo retoucher. The provided image is a composite where an object has been roughly pasted into the masked area. Your task is to realisticly integrate this object into the scene.\n\n1. Analyze the scene's lighting direction, color temperature, shadows, and perspective.\n2. Regenerate the object in the masked area so that it perfectly matches the environment. You may slightly adjust the object's posture, edges, or angle to ensure it obeys the laws of physics and the camera's focal length.\n3. Generate realistic contact shadows on the ground/surface.\n4. Ensure the film grain and noise levels match the rest of the photo.\n\nOutput a seamless, photorealistic result." },
          { inlineData: { mimeType: 'image/jpeg', data: rawComposite } },
          { inlineData: { mimeType: 'image/png', data: rawMask } }
        ]
      }
    });

    let resultImage = null;
    response.candidates?.[0]?.content?.parts.forEach(p => {
        if (p.inlineData) resultImage = `data:image/png;base64,${p.inlineData.data}`;
    });

    if (!resultImage) throw new Error("No image generated");
    return resultImage;

  } catch (error) {
    console.error("AI Place Error:", error);
    throw error;
  }
};