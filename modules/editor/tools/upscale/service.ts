import { GEMINI_IMAGE_MODEL } from '../../core/constants.ts';
import { cleanBase64, resizeImageForApi } from '../../central/canvas/helpers/canvas.utils.ts';
import { ai, withRetry } from '../../services/gemini.client.ts';
import { GenerateContentResponse } from "@google/genai";

/**
 * AI Image Upscaling Service
 * Leverages Gemini 3 Pro Image's native 4K output capability to enhance resolution.
 */
export const upscaleImageWithGemini = async (imageBase64: string): Promise<string> => {
  try {
    // Single line comment: Send original image to the model for high-res reconstruction.
    const rawImage = cleanBase64(await resizeImageForApi(imageBase64, 1024));

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: "Upscale this image to 4K resolution. Enhance details, remove artifacts, and improve clarity while maintaining 100% of the original content and colors. The result should be professional and photorealistic." },
          { inlineData: { mimeType: 'image/jpeg', data: rawImage } }
        ]
      },
      config: {
        // Single line comment: Explicitly requesting 4K output via the imageConfig property.
        imageConfig: {
          imageSize: "4K"
        }
      }
    }));

    let resultImage = null;
    // Single line comment: Find the generated high-resolution image part in the response.
    response.candidates?.[0]?.content?.parts.forEach(part => {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
      }
    });

    if (!resultImage) throw new Error("AI failed to upscale the image.");
    return resultImage;
  } catch (error) {
    console.error("Upscale AI Error:", error);
    throw error;
  }
};