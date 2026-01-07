import { GoogleGenAI } from "@google/genai";
import { GEMINI_IMAGE_MODEL, GEMINI_REASONING_MODEL } from '../constants';
import { cleanBase64, applyMaskToImage, resizeImageForApi } from '../utils/canvasHelpers';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Detaches an object with "Semantic Edge Snapping".
 * Command-focused prompting to ensure the AI snaps to object boundaries instead of user scribbles.
 */
export const detachObjectWithGemini = async (
  imageBase64: string,
  fullContextBase64: string, 
  croppedContextBase64: string 
): Promise<{ object: string | null, background: string | null, label: string }> => {
  
  try {
    const rawFullContext = cleanBase64(await resizeImageForApi(fullContextBase64, 1024));
    const rawCroppedContext = cleanBase64(croppedContextBase64);

    // STEP 1: DETAILED SEMANTIC ANALYSIS
    const reasoningResponse = await ai.models.generateContent({
      model: GEMINI_REASONING_MODEL,
      contents: {
        parts: [
          {
            text: `Act as a master image analyst. Look at the zoomed-in crop with the red highlight.
            1. Precisely name the primary object being selected (e.g., 'Wristwatch', 'Coffee Mug').
            2. Describe its visual boundaries (e.g., 'Sharp metallic edges', 'Soft shadow gradients', 'Translucent glass').
            3. Note any complex parts (e.g., 'The watch strap extending beyond the highlight').
            
            Return ONLY a JSON-style response (no markdown):
            {
              "label": "name of object",
              "edges": "description of edge type",
              "context": "description of what it sits on"
            }`
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: rawCroppedContext
            }
          }
        ]
      }
    });

    let sceneInfo = { label: "object", edges: "sharp", context: "background" };
    try {
        const text = reasoningResponse.text?.replace(/```json|```/g, '').trim() || "{}";
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            sceneInfo = JSON.parse(text.substring(start, end + 1));
        }
    } catch (e) {
        console.warn("Reasoning parse failed, using fallback", e);
    }
    
    console.log("Semantic Analysis:", sceneInfo);

    // STEP 2: PRECISION SEGMENTATION (The "Snap" Step)
    const maskPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          {
            text: `CRITICAL TASK: TIGHT INNER MASK GENERATION.
            TARGET: The ${sceneInfo.label}.
            VISUAL PROPERTIES: ${sceneInfo.edges}.
            
            STRICT RULES:
            - The RED HIGHLIGHT in the image is a ROUGH, MESSY HINT. Do NOT follow its shape.
            - You MUST perform 'Semantic Snapping': Find the actual physical edges of the ${sceneInfo.label}.
            - AGGRESSIVE UNDERCUT: To avoid white halos, the mask MUST be slightly SMALLER (inset by 2-3px) than the object. 
            - NO BACKGROUND BLEED: If the object is on a white background, cut INTO the object slightly to ensure NO white pixels remain.
            - NO SHADOWS: Exclude cast shadows.
            - DO NOT include any background pixels.
            
            OUTPUT: A pure binary Black & White mask. 
            WHITE (#FFFFFF) = The ${sceneInfo.label} (contracted). 
            BLACK (#000000) = Everything else.`
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: rawFullContext
            }
          }
        ]
      }
    });

    // STEP 3: INTELLIGENT INPAINTING
    const fillPromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          {
             text: `TASK: PROFESSIONAL CONTENT-AWARE FILL.
             OBJECT TO REMOVE: The ${sceneInfo.label} sitting on ${sceneInfo.context}.
             
             INSTRUCTIONS: 
             Remove the ${sceneInfo.label} completely. 
             Reconstruct the background hidden behind it. 
             The texture, lighting, and perspective of the ${sceneInfo.context} must be perfect. 
             Zero artifacts allowed.`
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: rawFullContext
            }
          }
        ]
      }
    });

    const [maskResponse, fillResponse] = await Promise.all([maskPromise, fillPromise]);

    let maskBase64 = null;
    let backgroundBase64 = null;

    for (const part of maskResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        maskBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    for (const part of fillResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        backgroundBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    let objectBase64 = null;
    if (maskBase64) {
        // High-res local processing with Mask Erosion
        objectBase64 = await applyMaskToImage(imageBase64, maskBase64);
    }

    return { 
        object: objectBase64, 
        background: backgroundBase64, 
        label: sceneInfo.label 
    };

  } catch (error) {
    console.error("Gemini Magic Service Error:", error);
    throw error;
  }
};