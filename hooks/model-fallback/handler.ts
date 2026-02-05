/**
 * Model Fallback Hook
 * Provides OpenRouter free tier with fallback to paid models.
 * Optimizes cost for background tasks.
 */

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        model?: string;
        modelRequest?: {
            prompt: string;
            maxTokens?: number;
        };
    };
}

// Fallback chain configuration
const FALLBACK_CHAIN = [
    { name: "openrouter_free", model: "meta-llama/llama-3.1-8b-instruct:free", cost: 0 },
    { name: "haiku", model: "claude-3-5-haiku", cost: 0.25 },
    { name: "gemini_flash", model: "gemini-2.0-flash", cost: 0.075 }
];

/**
 * Call model with error handling
 */
async function callModel(modelConfig: typeof FALLBACK_CHAIN[0], prompt: string): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
        console.log(`[model-fallback] Trying ${modelConfig.name}...`);

        // Mock API call (in production, use actual API)
        // const response = await anthropic.messages.create({ model: modelConfig.model, ... });

        // Simulate success for haiku, fail for free tier
        if (modelConfig.name === "openrouter_free") {
            throw new Error("Quota exceeded");
        }

        return {
            success: true,
            response: `Mock response from ${modelConfig.name}`
        };

    } catch (err: any) {
        console.log(`[model-fallback] ${modelConfig.name} failed: ${err.message}`);

        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Execute fallback chain
 */
async function executeWithFallback(prompt: string): Promise<string> {
    for (const modelConfig of FALLBACK_CHAIN) {
        const result = await callModel(modelConfig, prompt);

        if (result.success) {
            console.log(`[model-fallback] ✅ Success with ${modelConfig.name}`);
            return result.response!;
        }

        // Try next in chain
        console.log(`[model-fallback] → Falling back to next model...`);
    }

    // All models failed
    throw new Error("All models in fallback chain failed");
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle model requests with openrouter_free specified
    if (event.context?.model !== "openrouter_free") return;

    const prompt = event.context?.modelRequest?.prompt;
    if (!prompt) return;

    console.log("[model-fallback] OpenRouter free tier requested, executing fallback chain...");

    try {
        const response = await executeWithFallback(prompt);

        // Update event with response
        event.messages.push(response);

    } catch (err: any) {
        console.error("[model-fallback] All models failed:", err.message);
        event.messages.push("⚠️ Model fallback chain exhausted. Unable to process request.");
    }
};

export default handler;
