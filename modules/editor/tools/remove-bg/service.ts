import { GEMINI_IMAGE_MODEL } from '../../core/constants.ts';
import { cleanBase64, resizeImageForApi } from '../../central/canvas/helpers/canvas.utils.ts';
import { ai, withRetry } from '../../services/gemini.client.ts';
import { GenerateContentResponse } from "@google/genai";

/**
 * AI Background Removal Service
 * Generates a high-fidelity binary mask for the primary subjects in an image.
 */
export const removeBackgroundWithGemini = async (imageBase64: string): Promise<string> => {
  try {
    // Standardize input for API limits
    const rawImage = cleanBase64(await resizeImageForApi(imageBase64, 1024));

    // Request a binary mask of the main subject
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: "Identify the main subjects in this image and generate a high-precision binary mask. Output a mask where the subject is solid WHITE and the entire background is solid BLACK. Ensure edges are sharp and follow the subject contours perfectly." },
          { inlineData: { mimeType: 'image/jpeg', data: rawImage } }
        ]
      }
    }));

    let maskData = null;
    // Find the generated image part in the response
    response.candidates?.[0]?.content?.parts.forEach(part => { 
        if (part.inlineData) maskData = `data:image/png;base64,${part.inlineData.data}`; 
    });

    if (!maskData) throw new Error("AI failed to generate a segmentation mask.");
    
    return maskData;
  } catch (error) {
    console.error("Remove BG AI Error:", error);
    throw error;
  }
};