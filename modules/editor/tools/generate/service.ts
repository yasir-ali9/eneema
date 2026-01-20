import { GoogleGenAI } from "@google/genai";
import { ai, withRetry } from "../../services/gemini.client.ts";
import { cleanBase64, resizeImageForApi } from "../../central/canvas/helpers/canvas.utils.ts";
import { GEMINI_IMAGE_MODEL } from "../../core/constants.ts";
import { GenerateContentResponse } from "@google/genai";

/**
 * AI Image Generation Service
 * Handles both text-to-image and image-to-image (multi-modal) workflows.
 * Updated: Captures text responses to explain why an image might not have been generated.
 */
export const generateImageWithGemini = async (
  prompt: string,
  contextImages: string[] = [],
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
  imageSize: "1K" | "2K" | "4K" = "1K"
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

    // Single line comment: Construct the final payload with the user prompt, visual context, and requested ratio/size.
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
            imageSize: imageSize
          }
        }
      })
    );

    let resultImage = null;
    let refusalText = "";

    // Single line comment: Iterate through parts to find generated pixels OR explanation text.
    response.candidates?.[0]?.content?.parts?.forEach((part) => {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        refusalText += part.text + " ";
      }
    });

    if (!resultImage) {
      // Single line comment: If the model gave a reason (safety/technical), use it in the error.
      const errorMsg = refusalText.trim() 
        ? `Gemini: "${refusalText.trim()}"` 
        : "AI failed to generate an image. This might be due to safety filters or unsupported aspect ratio keywords.";
      throw new Error(errorMsg);
    }
    
    return resultImage;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};