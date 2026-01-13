import { GEMINI_IMAGE_MODEL } from '../../core/constants.ts';
import { cleanBase64, resizeImageForApi } from '../../central/canvas/helpers/canvas.utils.ts';
import { ai } from '../../services/gemini.client.ts';

/**
 * Intelligent "Place" Tool.
 * Uses Gemini 3 Pro Image to REGENERATE the object within the masked area.
 */
export const placeObjectWithGemini = async (
  compositeBase64: string,
  maskBase64: string
): Promise<string> => {
  try {
    const rawComposite = cleanBase64(await resizeImageForApi(compositeBase64, 1024));
    const rawMask = cleanBase64(await resizeImageForApi(maskBase64, 1024));

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
