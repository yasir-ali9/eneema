import { GoogleGenAI } from "@google/genai";
import { ai, withRetry } from "../../services/gemini.client.ts";
import { cleanBase64, resizeImageForApi } from "../../central/canvas/helpers/canvas.utils.ts";
import { GEMINI_IMAGE_MODEL } from "../../core/constants.ts";
import { GenerateContentResponse } from "@google/genai";

/**
 * AI Image Generation Service
 * Handles both text-to-image and image-to-image (multi-modal) workflows.
 * Updated: Supports dynamic aspect ratios for precise layout control.
 */
export const generateImageWithGemini = async (
  prompt: string,
  contextImages: string[] = [],
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
): Promise<string> => {
  try {
    // Single line comment: Map selected images to Gemini parts, capped at 14 for Nano Banana Pro.
    const imageParts = await Promise.all(
      contextImages.slice(0, 14).map(async (src) => {
        const resized = await resizeImageForApi(src, 1024);
        return {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64(resized),
          },
        };
      })
    );

    // Single line comment: Construct the final payload with the user prompt, visual context, and requested ratio.
    const response: GenerateContentResponse = await withRetry(() =>
      ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: {
          parts: [
            { text: prompt },
            ...imageParts,
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
          }
        }
      })
    );

    let resultImage = null;
    // Single line comment: Iterate through parts to find the generated content.
    response.candidates?.[0]?.content?.parts.forEach((part) => {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
      }
    });

    if (!resultImage) throw new Error("AI failed to generate an image.");
    return resultImage;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};