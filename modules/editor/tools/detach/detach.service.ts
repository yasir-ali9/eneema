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
    // We use the zoomed-in crop so the model sees the object detail clearly.
    // Updated prompt to handle multiple objects (plural/collective labels).
    const reasoningResponse = await ai.models.generateContent({
      model: GEMINI_REASONING_MODEL,
      contents: {
        parts: [
          { text: "Identify the object(s) loosely covered by the red highlight. If multiple items are highlighted, provide a short collective label (e.g., 'watches', 'coffee cups'). Return only the JSON: {\"label\": \"name\"}" },
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

    console.log("Detected Object(s):", sceneInfo.label);

    // Phase 2: Masking & Inpainting
    // Masking: Updated to strictly follow the red highlight for ALL marked areas.
    const maskPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Generate a high-precision binary mask for the '${sceneInfo.label}' detected in the images. \n\nInput 1: Clean Original Image (Reference for edges).\nInput 2: Image with Red Highlight (Sloppy User Selection).\n\nTask: Output a precise binary mask (White=Object, Black=Background) for the '${sceneInfo.label}' that is roughly marked in Input 2.\n\nCRITICAL INSTRUCTIONS:\n1. The red highlight in Input 2 is sloppy and extends into the background. IGNORE the exact shape of the red highlight.\n2. Use Input 1 to find the precise edges of the '${sceneInfo.label}'. Snap the mask tightly to the object boundaries.\n3. EXCLUDE any background pixels, even if they are covered by the red highlight.\n4. Ensure the mask handles all objects marked by the highlight.` },
          { inlineData: { mimeType: 'image/jpeg', data: rawCleanFull } },
          { inlineData: { mimeType: 'image/jpeg', data: rawHighlightedFull } }
        ]
      }
    });

    // Inpainting: Updated to remove ALL marked objects.
    const fillPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Remove the '${sceneInfo.label}' marked by the red highlight in the second image. \n\nInput 1: Original Image.\nInput 2: Image with Red Highlight indicating objects to remove.\n\nTask: Output a clean background image where all red-highlighted objects are completely removed and the background is seamlessly reconstructed.` },
          { inlineData: { mimeType: 'image/jpeg', data: rawCleanFull } },
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
