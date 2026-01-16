import { GEMINI_IMAGE_MODEL, GEMINI_REASONING_MODEL } from '../../core/constants.ts';
import { cleanBase64, resizeImageForApi } from '../../central/canvas/helpers/canvas.utils.ts';
import { ai, withRetry } from '../../services/gemini.client.ts';
import { Type, GenerateContentResponse } from "@google/genai";

/**
 * Phase 1: Extracts text hierarchy from image using Gemini 3 Flash
 * Wrapped with retry logic to handle model congestion.
 */
export const extractTextWithGemini = async (imageBase64: string) => {
  // Standardize input image for API consumption
  const rawImage = cleanBase64(await resizeImageForApi(imageBase64, 1024));

  // Prompt refined to differentiate hierarchy (e.g. quote vs author name)
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: GEMINI_REASONING_MODEL,
    contents: {
      parts: [
        { 
          text: `Analyze this image and extract all text content. 
          
          CRITICAL RULES FOR GROUPING:
          1. SEMANTIC GROUPING: Group contiguous lines that share the EXACT same visual style (font family, size, weight, color) and semantic role (e.g., a multi-line quote or a single paragraph) into one string.
          2. HIERARCHY DIFFERENTIATION: Do NOT group lines together if they have distinct visual differences. For example, a quote and its author attribution (often in a different font size or style) MUST be separate strings.
          3. LOGICAL BREAKS: Headings, sub-headings, body text, and footnotes should all be distinct blocks.
          
          Return only JSON in this format: { "texts": ["Full Quote Block", "Author Name", "Footer Info"] }` 
        },
        { inlineData: { mimeType: 'image/jpeg', data: rawImage } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          texts: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["texts"]
      }
    }
  }));

  try {
    // Access the generated text and parse it as JSON
    const data = JSON.parse(response.text || "{}");
    return data.texts || [];
  } catch (e) {
    console.error("Failed to parse text extraction", e);
    return [];
  }
};

/**
 * Phase 2: Regenerates image with updated text using Gemini 3 Pro Image
 * Wrapped with retry logic and enhanced image part detection.
 */
export const updateTextInImage = async (
  imageBase64: string,
  updates: { original: string; updated: string }[]
): Promise<string> => {
  // Standardize input image for API consumption
  const rawImage = cleanBase64(await resizeImageForApi(imageBase64, 1024));
  
  // Build clear instructions for each text change requested
  const updateInstructions = updates
    .map(u => `- Replace the exact text block "${u.original}" with "${u.updated}"`)
    .join('\n');

  const prompt = `You are a world-class graphic designer and photo editor. In the provided image, perform the following text replacements:\n\n${updateInstructions}\n\nCRITICAL DESIGN REQUIREMENTS:\n1. Maintain the EXACT font style, weight, color, size, tracking, and spatial positioning of each original text block.\n2. Ensure the text remains perfectly sharp and integrated with the background. No blurriness or compression artifacts around letters.\n3. The background texture, lighting, and noise levels must be 100% identical to the original.\n4. If the new text length differs significantly, center it or align it within the original bounding box to maintain the professional layout.\n5. Do not modify or move any other elements in the image.`;

  // Send the request to the high-quality image generation model
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: rawImage } }
      ]
    }
  }));

  let resultImage = null;
  // Iterate through parts of the typed response to find the generated image data
  response.candidates?.[0]?.content?.parts.forEach(part => {
    if (part.inlineData) {
      resultImage = `data:image/png;base64,${part.inlineData.data}`;
    }
  });

  if (!resultImage) throw new Error("No image generated");
  return resultImage;
};