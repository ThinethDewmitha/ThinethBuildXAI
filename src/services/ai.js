/**
 * BuildX AI – Dual AI orchestration
 * Gemini: vision analysis + blueprint image generation
 * Groq: fast vision cross-check + merge/enrichment + refinements
 */
import {
  initializeGemini,
  validateApiKey as validateGeminiKey,
  analyzeSite as geminiAnalyzeSite,
  generateBlueprintImage,
  refineBlueprint as geminiRefineBlueprint,
  validateSpecs,
} from './gemini';
import {
  initializeGroq,
  validateGroqKey,
  isGroqReady,
  groqVisionSiteAssessment,
  groqMergeDualAnalysis,
  refineBlueprintWithGroq,
} from './groq';

export {
  initializeGemini,
  validateGeminiKey,
  validateGroqKey,
  isGroqReady,
  generateBlueprintImage,
  validateSpecs,
};

export function initializeAI({ geminiKey, groqKey }) {
  if (geminiKey) initializeGemini(geminiKey);
  if (groqKey) initializeGroq(groqKey);
  else initializeGroq('');
}

/**
 * Dual-AI site analysis:
 * 1) Gemini — full multimodal engineering report
 * 2) Groq vision — independent photo assessment (if Groq key set)
 * 3) Groq text — merge both into final enhanced report
 */
export async function analyzeSite(imageFiles, specs, siteLocation = null) {
  const geminiResult = await geminiAnalyzeSite(imageFiles, specs, siteLocation);

  if (!isGroqReady() || geminiResult._isMockFallback) {
    return geminiResult;
  }

  try {
    console.log('🚀 Dual-AI: running Groq vision + merge pass…');
    const groqVision = await groqVisionSiteAssessment(imageFiles, specs, siteLocation);
    const merged = await groqMergeDualAnalysis(geminiResult, groqVision, specs, siteLocation);
    return {
      ...merged,
      _dualAi: true,
      _providers: ['gemini', 'groq'],
    };
  } catch (err) {
    console.warn('Dual-AI Groq pass failed, using Gemini-only result:', err.message);
    return {
      ...geminiResult,
      _dualAi: false,
      _groqError: err.message,
    };
  }
}

export async function refineBlueprint(currentAnalysis, feedback, specs) {
  if (isGroqReady()) {
    try {
      return await refineBlueprintWithGroq(currentAnalysis, feedback, specs);
    } catch (err) {
      console.warn('Groq refine failed, falling back to Gemini:', err.message);
    }
  }
  return geminiRefineBlueprint(currentAnalysis, feedback, specs);
}
