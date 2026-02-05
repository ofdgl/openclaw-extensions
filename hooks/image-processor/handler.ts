/**
 * Image Processor Hook
 * Processes images with Gemini Flash vision API.
 * Detects image attachments and adds descriptions to context.
 */

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        attachments?: Array<{
            type: string;
            url?: string;
            data?: Buffer;
            mimeType?: string;
        }>;
        imageDescriptions?: string[];
        messageText?: string;
    };
}

/**
 * Mock Gemini Flash API call
 * In production, this would use @google/generative-ai package
 */
async function callGeminiFlash(imageData: Buffer, mimeType: string, model: string): Promise<string> {
    // Mock implementation
    console.log(`[image-processor] Calling ${model} (${mimeType}, ${imageData.length} bytes)`);

    // In production:
    // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // const geminiModel = genAI.getGenerativeModel({ model });
    // const result = await geminiModel.generateContent([
    //     { inlineData: { data: imageData.toString('base64'), mimeType } },
    //     { text: "Describe this image in detail." }
    // ]);
    // return result.response.text();

    return "Mock image description: A document or screenshot";
}

/**
 * Process single image
 */
async function processImage(attachment: any): Promise<string> {
    const primaryModel = "gemini-3-flash-preview";
    const fallbackModel = "gemini-2.5-flash";

    try {
        // Try primary model
        return await callGeminiFlash(
            attachment.data || Buffer.from(""),
            attachment.mimeType || "image/jpeg",
            primaryModel
        );
    } catch (primaryError: any) {
        console.log(`[image-processor] Primary model failed: ${primaryError.message}`);

        try {
            // Fallback to gemini-2.5-flash
            console.log(`[image-processor] Trying fallback: ${fallbackModel}`);
            return await callGeminiFlash(
                attachment.data || Buffer.from(""),
                attachment.mimeType || "image/jpeg",
                fallbackModel
            );
        } catch (fallbackError: any) {
            console.error(`[image-processor] Both models failed: ${fallbackError.message}`);
            return "[Image processing failed]";
        }
    }
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:message (when message arrives)
    if (event.type !== "agent" || event.action !== "message") return;

    const attachments = event.context?.attachments || [];

    // Filter image attachments
    const imageAttachments = attachments.filter(att =>
        att.type === "image" || att.mimeType?.startsWith("image/")
    );

    if (imageAttachments.length === 0) return;

    console.log(`[image-processor] Processing ${imageAttachments.length} image(s)`);

    // Process images sequentially
    const descriptions: string[] = [];
    for (const attachment of imageAttachments) {
        try {
            const description = await processImage(attachment);
            descriptions.push(description);
        } catch (err: any) {
            console.error(`[image-processor] Error processing image:`, err.message);
            descriptions.push("[Image processing error]");
        }
    }

    // Add descriptions to context
    if (!event.context.imageDescriptions) {
        event.context.imageDescriptions = [];
    }
    event.context.imageDescriptions.push(...descriptions);

    // Append to message text
    const descriptionsText = descriptions
        .map((desc, i) => `[Image ${i + 1}]: ${desc}`)
        .join("\n");

    event.context.messageText = `${event.context.messageText || ""}\n\n${descriptionsText}`;

    console.log(`[image-processor] Added ${descriptions.length} image description(s)`);
};

export default handler;
