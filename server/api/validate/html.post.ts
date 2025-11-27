import { validateHTML, formatValidationErrors } from '../../utils/htmlValidator';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const { html } = body as { html: string };

        if (!html) {
            throw createError({
                statusCode: 400,
                message: 'Missing required field: html',
            });
        }

        const result = validateHTML(html);

        return {
            isValid: result.isValid,
            errors: result.errors,
            suggestions: result.suggestions,
            formattedMessage: formatValidationErrors(result),
        };
    } catch (error) {
        console.error('HTML validation error:', error);
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to validate HTML',
        });
    }
});
