/**
 * BuildX AI – Groq service (OpenAI-compatible API)
 * Vision + fast reasoning — pairs with Gemini for dual-AI analysis.
 */
import { PHOTO_LABELS } from '../constants/photos';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const VISION_MODEL_CHAIN = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
];

const TEXT_MODEL_CHAIN = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];

let groqApiKey = null;

function sanitizeApiKey(key) {
  if (!key) return '';
  return key.trim().replace(/[^\x20-\x7E]/g, '');
}

export function initializeGroq(apiKey) {
  groqApiKey = sanitizeApiKey(apiKey);
}

export function isGroqReady() {
  return Boolean(groqApiKey);
}

export async function validateGroqKey(apiKey) {
  const cleanKey = sanitizeApiKey(apiKey);
  if (!cleanKey) {
    return { valid: false, error: 'Please enter your Groq API key.' };
  }
  if (!cleanKey.startsWith('gsk_') || cleanKey.length < 20) {
    return {
      valid: false,
      error: 'This doesn\'t look like a valid Groq API key. Keys start with "gsk_".',
    };
  }
  return { valid: true, model: TEXT_MODEL_CHAIN[0] };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function buildVisionContent(imageFiles, textPrompt) {
  const content = [{ type: 'text', text: textPrompt }];
  for (const [side, file] of Object.entries(imageFiles)) {
    const base64 = await fileToBase64(file);
    content.push({ type: 'text', text: `[${PHOTO_LABELS[side] || side}]` });
    content.push({
      type: 'image_url',
      image_url: { url: `data:${file.type || 'image/jpeg'};base64,${base64}` },
    });
  }
  return content;
}

function parseJsonFromText(text) {
  if (!text?.trim()) throw new Error('Empty AI response');
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) {
      return JSON.parse(cleaned.substring(first, last + 1));
    }
    throw new Error('Could not parse JSON from Groq response');
  }
}

async function groqChat({ messages, models, jsonMode = true, maxTokens = 16384 }) {
  if (!groqApiKey) throw new Error('Groq not initialized. Add your Groq API key.');

  let lastError = null;
  for (const model of models) {
    try {
      const res = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.35,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || `Groq HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403) {
          throw new Error(`Groq API key invalid: ${msg}`);
        }
        throw new Error(msg);
      }

      const text = data.choices?.[0]?.message?.content;
      console.log(`✅ Groq success with ${model}`);
      return jsonMode ? parseJsonFromText(text) : text;
    } catch (err) {
      lastError = err;
      console.warn(`Groq model ${model} failed:`, err.message);
    }
  }
  throw lastError || new Error('All Groq models failed');
}

/**
 * Groq vision pass — independent site read from photos (fast scout model).
 */
export async function groqVisionSiteAssessment(imageFiles, specs, siteLocation = null) {
  const locationLine = siteLocation
    ? `GPS region: ${siteLocation.region || siteLocation.city || siteLocation.address || 'unknown'}`
    : 'GPS: not provided';

  const prompt = `You are a civil engineer reviewing construction site photos.
${locationLine}
Building type: ${(specs.buildingType || 'residential_house').replace(/_/g, ' ')}
Dimensions: ${specs.length} x ${specs.width} ${specs.unit}

Study ALL images. Return JSON only:
{
  "soilObservations": "detailed soil and ground observations from photos",
  "terrainAndDrainage": "slope, drainage, accessibility",
  "boundaryAndContext": "plot boundaries, neighbors, roads, vegetation",
  "safetyHazards": ["specific hazards visible"],
  "confidenceNotes": "what is clear vs uncertain from photos alone"
}`;

  const content = await buildVisionContent(imageFiles, prompt);
  return groqChat({
    messages: [
      { role: 'system', content: 'You are an expert site engineer. Respond with valid JSON only.' },
      { role: 'user', content },
    ],
    models: VISION_MODEL_CHAIN,
    maxTokens: 4096,
  });
}

/**
 * Merge Gemini full report + Groq vision notes into one enhanced blueprint JSON.
 */
export async function groqMergeDualAnalysis(geminiAnalysis, groqVision, specs, siteLocation = null) {
  const prompt = `You are a lead structural engineer producing the FINAL merged construction blueprint.

Combine:
1) Gemini multimodal engineering report (comprehensive draft)
2) Groq vision site assessment (photo-grounded observations)

Rules:
- Keep the EXACT JSON schema from the Gemini draft (all top-level keys and nested structure).
- Prefer Groq vision notes for siteAssessment when they add photo-specific detail.
- Improve foundation, materials, safety, and stepByStepGuide with deeper engineering accuracy.
- Fix any contradictions between the two AI analyses.
- Expand thin sections; keep numbers realistic for building size.
- Output ONLY valid JSON. No markdown.

Building specs: ${JSON.stringify({
    buildingType: specs.buildingType,
    area: specs.area,
    length: specs.length,
    width: specs.width,
    totalHeight: specs.totalHeight,
    floors: specs.floors,
    wallType: specs.wallType,
    wallThickness: specs.wallThickness,
    unit: specs.unit,
    description: specs.description,
  })}

Site location: ${JSON.stringify(siteLocation || {})}

Groq vision assessment:
${JSON.stringify(groqVision)}

Gemini draft report:
${JSON.stringify(geminiAnalysis)}`;

  return groqChat({
    messages: [
      { role: 'system', content: 'Merge engineering reports into one improved JSON blueprint. Valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    models: TEXT_MODEL_CHAIN,
    maxTokens: 32768,
  });
}

/**
 * Refine blueprint with Groq (fast text reasoning).
 */
export async function refineBlueprintWithGroq(currentAnalysis, feedback, specs) {
  const prompt = `Update this construction engineering blueprint JSON per user feedback.

User feedback: "${feedback}"

Building: ${specs.length}x${specs.width} ${specs.unit}, ${specs.floors} floors, ${specs.wallType} ${specs.wallThickness}mm walls.

If feedback is unsafe, note in safetyWarnings but provide the best safe alternative.

Return the FULL updated JSON with the same structure.

Current blueprint:
${JSON.stringify(currentAnalysis)}`;

  return groqChat({
    messages: [
      { role: 'system', content: 'Expert structural engineer. Output valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    models: TEXT_MODEL_CHAIN,
    maxTokens: 32768,
  });
}
