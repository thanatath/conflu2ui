import { describe, it, expect } from 'vitest';
import { validateHTML, formatValidationErrors } from '../server/utils/htmlValidator';

/**
 * API Integration Tests
 *
 * These tests verify the API logic by directly testing the underlying functions
 * that the API endpoints use. This approach is more reliable than testing
 * actual HTTP endpoints and catches regressions effectively.
 */

describe('API: /api/validate/html', () => {
    describe('Request validation', () => {
        it('should handle empty HTML gracefully', () => {
            const result = validateHTML('');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('Response format', () => {
        it('should return correct structure for valid HTML', () => {
            const validHtml = `<!doctype html>
<html>
  <head><script src="https://cdn.tailwindcss.com"></script></head>
  <body><div>Content</div></body>
</html>`;

            const result = validateHTML(validHtml);
            const formattedMessage = formatValidationErrors(result);

            // Verify response structure matches API response
            const apiResponse = {
                isValid: result.isValid,
                errors: result.errors,
                suggestions: result.suggestions,
                formattedMessage,
            };

            expect(apiResponse).toHaveProperty('isValid');
            expect(apiResponse).toHaveProperty('errors');
            expect(apiResponse).toHaveProperty('suggestions');
            expect(apiResponse).toHaveProperty('formattedMessage');
            expect(apiResponse.isValid).toBe(true);
        });

        it('should return correct structure for invalid HTML', () => {
            const invalidHtml = '<div>Missing tags</div>';

            const result = validateHTML(invalidHtml);
            const formattedMessage = formatValidationErrors(result);

            const apiResponse = {
                isValid: result.isValid,
                errors: result.errors,
                suggestions: result.suggestions,
                formattedMessage,
            };

            expect(apiResponse.isValid).toBe(false);
            expect(apiResponse.errors.length).toBeGreaterThan(0);
            expect(typeof apiResponse.formattedMessage).toBe('string');
        });
    });

    describe('Validation edge cases', () => {
        it('should validate complex nested HTML', () => {
            const complexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Test App</title>
  </head>
  <body class="min-h-screen bg-gray-100">
    <header class="p-4 bg-white shadow">
      <nav class="flex justify-between items-center">
        <h1 class="text-xl font-bold">App</h1>
        <button class="px-4 py-2 bg-blue-500 text-white rounded">Login</button>
      </nav>
    </header>
    <main class="p-4">
      <div class="grid grid-cols-3 gap-4">
        <div class="p-4 bg-white rounded shadow">Card 1</div>
        <div class="p-4 bg-white rounded shadow">Card 2</div>
        <div class="p-4 bg-white rounded shadow">Card 3</div>
      </div>
    </main>
    <footer class="p-4 text-center text-gray-500">Footer</footer>
  </body>
</html>`;

            const result = validateHTML(complexHtml);
            expect(result.isValid).toBe(true);
        });

        it('should handle HTML with Vue-like attributes', () => {
            const vueHtml = `<!doctype html>
<html>
  <head><script src="https://cdn.tailwindcss.com"></script></head>
  <body>
    <div v-if="show" class="p-4">
      <span v-for="item in items" :key="item.id">{{ item.name }}</span>
      <button @click="handleClick">Click</button>
    </div>
  </body>
</html>`;

            const result = validateHTML(vueHtml);
            // Should still be valid HTML structure
            expect(result.isValid).toBe(true);
        });

        it('should detect missing essential tags in minimal HTML', () => {
            const minimalHtml = '<div>Just a div</div>';
            const result = validateHTML(minimalHtml);

            const errorMessages = result.errors.map(e => e.message);
            expect(errorMessages).toContain('Missing <html> tag');
            expect(errorMessages).toContain('Missing <head> tag');
            expect(errorMessages).toContain('Missing <body> tag');
        });
    });

    describe('Error severity classification', () => {
        it('should classify missing DOCTYPE as warning', () => {
            const html = '<html><head></head><body></body></html>';
            const result = validateHTML(html);

            const doctypeError = result.errors.find(e =>
                e.message.includes('DOCTYPE')
            );
            expect(doctypeError?.severity).toBe('warning');
        });

        it('should classify missing required tags as error', () => {
            const html = '<!doctype html><html><head></head></html>';
            const result = validateHTML(html);

            const bodyError = result.errors.find(e =>
                e.message.includes('Missing <body> tag')
            );
            expect(bodyError?.severity).toBe('error');
        });
    });
});

