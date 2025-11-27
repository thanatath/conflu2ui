export default defineEventHandler(async (event) => {
    try {
        const form = await readMultipartFormData(event);

        if (!form) {
            throw createError({
                statusCode: 400,
                message: 'No file uploaded',
            });
        }

        const results: Array<{ filename: string; content: string; type: string }> = [];

        for (const part of form) {
            if (part.filename && part.data) {
                const filename = part.filename;
                const type = part.type || 'text/plain';

                // Handle text files (markdown, txt)
                if (type.startsWith('text/') || filename.endsWith('.md') || filename.endsWith('.txt')) {
                    const content = part.data.toString('utf-8');
                    results.push({
                        filename,
                        content,
                        type: 'text',
                    });
                }
                // Handle images
                else if (type.startsWith('image/')) {
                    const base64 = part.data.toString('base64');
                    results.push({
                        filename,
                        content: `data:${type};base64,${base64}`,
                        type: 'image',
                    });
                }
                else {
                    throw createError({
                        statusCode: 400,
                        message: `Unsupported file type: ${type}`,
                    });
                }
            }
        }

        return {
            success: true,
            files: results,
        };
    } catch (error) {
        console.error('File upload error:', error);
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to process upload',
        });
    }
});
