import { streamAIResponse } from '../../utils/aiProvider';
import { getSystemPrompt, createContextMessage } from '../../utils/prompts';
import type { AIMessage, AgentContext } from '../../types/agents';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const { role, messages, contextDocument, model, temperature } = body as {
            role: 'ba' | 'sa' | 'dev';
            messages: AIMessage[];
            contextDocument?: string;
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

        // Add conversation history
        fullMessages.push(...messages);

        // Debug: Log the payload being sent
        console.log('[AI API] Sending payload:', {
            model: model || useRuntimeConfig().aiProviderModel,
            messageCount: fullMessages.length,
            messages: fullMessages,
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
                    const errorData = `data: ${JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error',
                        done: true,
                    })}\n\n`;
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
