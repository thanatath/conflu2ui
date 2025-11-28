import { streamAIResponse, AIProviderError } from '../../utils/aiProvider';
import { getSystemPrompt, createContextMessage } from '../../utils/prompts';
import type { AIMessage, AITextContent, AIImageContent } from '../../types/agents';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const { role, messages, contextDocument, referenceImages, model, temperature } = body as {
            role: 'ba' | 'sa' | 'dev';
            messages: AIMessage[];
            contextDocument?: string;
            referenceImages?: string[];
            model?: string;
            temperature?: number;
        };

        if (!role || !messages) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: role and messages',
            });
        }

        // Build the full message array with system prompt
        const systemPrompt = getSystemPrompt(role);

        // Merge context document into system prompt if provided (only 1 system message allowed)
        let fullSystemPrompt = systemPrompt;
        if (contextDocument) {
            const contextMsg = createContextMessage(role, contextDocument);
            if (contextMsg) {
                fullSystemPrompt = `${systemPrompt}\n\n${contextMsg}`;
            }
        }

        const fullMessages: AIMessage[] = [
            { role: 'system', content: fullSystemPrompt },
        ];

        // Add conversation history, attaching images to the first user message
        let imagesAttached = false;
        for (const msg of messages) {
            if (msg.role === 'user' && !imagesAttached && referenceImages && referenceImages.length > 0) {
                // Convert first user message to multimodal format with images
                const textContent: AITextContent = {
                    type: 'text',
                    text: typeof msg.content === 'string' ? msg.content : (msg.content as AITextContent[]).map(c => c.type === 'text' ? c.text : '').join(''),
                };
                const imageContents: AIImageContent[] = referenceImages.map(img => ({
                    type: 'image_url' as const,
                    image_url: {
                        url: img,
                        detail: 'auto' as const,
                    },
                }));
                fullMessages.push({
                    role: 'user',
                    content: [textContent, ...imageContents],
                });
                imagesAttached = true;
            } else {
                fullMessages.push(msg);
            }
        }

        // Debug: Log the payload being sent (truncate image data)
        console.log('[AI API] Sending payload:', {
            model: model || useRuntimeConfig().aiProviderModel,
            messageCount: fullMessages.length,
            hasImages: referenceImages && referenceImages.length > 0,
            imageCount: referenceImages?.length || 0,
        });

        // Set response headers for SSE
        setResponseHeaders(event, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        // Create readable stream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamAIResponse(
                        fullMessages,
                        model,  // Will use default from config if undefined
                        temperature || 0.7
                    )) {
                        const data = `data: ${JSON.stringify(chunk)}\n\n`;
                        controller.enqueue(new TextEncoder().encode(data));

                        if (chunk.done) {
                            controller.close();
                            break;
                        }
                    }
                } catch (error) {
                    // Enhanced error handling for retry-related errors
                    let errorPayload: {
                        error: string;
                        code?: string;
                        retriesAttempted?: number;
                        isRetryError?: boolean;
                        done: boolean;
                    } = {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        done: true,
                    };

                    if (error instanceof AIProviderError) {
                        errorPayload = {
                            error: error.message,
                            code: error.code,
                            retriesAttempted: error.retriesAttempted,
                            isRetryError: true,
                            done: true,
                        };
                        console.error('[AI API] Retry exhausted error:', errorPayload);
                    }

                    const errorData = `data: ${JSON.stringify(errorPayload)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(errorData));
                    controller.close();
                }
            },
        });

        return stream;
    } catch (error) {
        console.error('AI stream error:', error);
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to stream AI response',
        });
    }
});
