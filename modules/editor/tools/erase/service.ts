import { GEMINI_IMAGE_MODEL } from '../../core/constants.ts';
import { cleanBase64, resizeImageForApi } from '../../central/canvas/helpers/canvas.utils.ts';
import { ai, withRetry } from '../../services/gemini.client.ts';
import { GenerateContentResponse } from "@google/genai";

/**
 * AI Generative Erase Service.
 * Removes highlighted objects and inpaints the background.
 * Single line comment: Uses a dual-image prompt to guide the model on exactly what to remove.
 */
export const eraseObjectWithGemini = async (
  imageBase64: string,
  highlightedBase64: string
): Promise<string> => {
  try {
    const rawClean = cleanBase64(await resizeImageForApi(imageBase64, 1024));
    const rawHighlighted = cleanBase64(await resizeImageForApi(highlightedBase64, 1024));

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: "You are an expert photo editor. The first image is the original. The second image has a red highlight indicating an object to be removed. Remove the highlighted object completely and reconstruct the background behind it so it looks perfectly natural and seamless. Match the surrounding lighting, texture, and grain perfectly." },
          { inlineData: { mimeType: 'image/jpeg', data: rawClean } },
          { inlineData: { mimeType: 'image/jpeg', data: rawHighlighted } }
        ]
      }
    }));

    let resultImage = null;
    response.candidates?.[0]?.content?.parts.forEach(part => {
      if (part.inlineData) resultImage = `data:image/png;base64,${part.inlineData.data}`;
    });

    if (!resultImage) throw new Error("AI failed to regenerate the background.");
    return resultImage;
  } catch (error) {
    console.error("Erase AI Service Error:", error);
    throw error;
  }
};