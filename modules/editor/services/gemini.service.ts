import { GoogleGenAI } from "@google/genai";
import { GEMINI_IMAGE_MODEL, GEMINI_REASONING_MODEL } from '../core/constants.ts';
import { cleanBase64, applyMaskToImage, resizeImageForApi } from '../central/canvas/helpers/canvas.utils.ts';
import { ProcessedImageResult } from '../core/types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// AI object extraction pipeline
export const detachObjectWithGemini = async (
  imageBase64: string,
  fullContextBase64: string, 
  croppedContextBase64: string 
): Promise<ProcessedImageResult> => {
  try {
    const rawFullContext = cleanBase64(await resizeImageForApi(fullContextBase64, 1024));
    const rawCroppedContext = cleanBase64(croppedContextBase64);

    const reasoningResponse = await ai.models.generateContent({
      model: GEMINI_REASONING_MODEL,
      contents: {
        parts: [
          { text: "Identify the object in the red highlight. Return JSON: {\"label\": \"name\"}" },
          { inlineData: { mimeType: 'image/jpeg', data: rawCroppedContext } }
        ]
      }
    });

    let sceneInfo = { label: "object" };
    try {
        const text = reasoningResponse.text?.replace(/```json|```/g, '').trim() || "{}";
        const match = text.match(/\{.*\}/s);
        if (match) sceneInfo = JSON.parse(match[0]);
    } catch (e) { console.warn("Reasoning failed"); }

    const maskPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Generate a binary mask for the ${sceneInfo.label}. White on Black.` },
          { inlineData: { mimeType: 'image/jpeg', data: rawFullContext } }
        ]
      }
    });

    const fillPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Inpaint the background perfectly removing the ${sceneInfo.label}.` },
          { inlineData: { mimeType: 'image/jpeg', data: rawFullContext } }
        ]
      }
    });

    const [maskRes, fillRes] = await Promise.all([maskPromise, fillPromise]);

    let maskData = null, bgData = null;
    maskRes.candidates?.[0]?.content?.parts.forEach(p => { if (p.inlineData) maskData = `data:image/png;base64,${p.inlineData.data}`; });
    fillRes.candidates?.[0]?.content?.parts.forEach(p => { if (p.inlineData) bgData = `data:image/png;base64,${p.inlineData.data}`; });

    let objData = null;
    if (maskData) objData = await applyMaskToImage(imageBase64, maskData);

    return { object: objData, background: bgData, label: sceneInfo.label };
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};