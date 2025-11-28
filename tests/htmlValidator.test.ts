import { describe, it, expect } from 'vitest';
import { validateHTML, formatValidationErrors } from '../server/utils/htmlValidator';

describe('validateHTML', () => {
    describe('Empty content', () => {
        it('should return error for empty HTML', () => {
            const result = validateHTML('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(
                expect.objectContaining({ message: 'HTML content is empty' })
            );
        });

        it('should return error for whitespace-only HTML', () => {
            const result = validateHTML('   \n\t  ');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(
                expect.objectContaining({ message: 'HTML content is empty' })
            );
        });
    });

    describe('DOCTYPE validation', () => {
        it('should warn about missing DOCTYPE', () => {
            const html = '<html><head></head><body></body></html>';
            const result = validateHTML(html);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    message: 'Missing <!DOCTYPE html> declaration',
                    severity: 'warning',
                })
            );
        });

        it('should accept DOCTYPE (case insensitive)', () => {
            const htmlLower = '<!doctype html><html><head></head><body></body></html>';
            const htmlUpper = '<!DOCTYPE HTML><html><head></head><body></body></html>';

            const resultLower = validateHTML(htmlLower);
            const resultUpper = validateHTML(htmlUpper);

            expect(resultLower.errors).not.toContainEqual(
                expect.objectContaining({ message: 'Missing <!DOCTYPE html> declaration' })
            );
            expect(resultUpper.errors).not.toContainEqual(
                expect.objectContaining({ message: 'Missing <!DOCTYPE html> declaration' })
            );
        });
    });

    describe('Required tags validation', () => {
        it('should error when missing <html> tag', () => {
            const html = '<!doctype html><head></head><body></body>';
            const result = validateHTML(html);
            expect(result.errors).toContainEqual(
                expect.objectContaining({ message: 'Missing <html> tag', severity: 'error' })
            );
        });

        it('should error when missing <head> tag', () => {
            const html = '<!doctype html><html><body></body></html>';
            const result = validateHTML(html);
            expect(result.errors).toContainEqual(
                expect.objectContaining({ message: 'Missing <head> tag', severity: 'error' })
            );
        });

        it('should error when missing <body> tag', () => {
            const html = '<!doctype html><html><head></head></html>';
            const result = validateHTML(html);
            expect(result.errors).toContainEqual(
                expect.objectContaining({ message: 'Missing <body> tag', severity: 'error' })
            );
        });

        it('should pass with all required tags', () => {
            const html = `<!doctype html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div>Content</div>
  </body>
</html>`;
            const result = validateHTML(html);
            expect(result.isValid).toBe(true);
            expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
        });
    });

    describe('Tailwind CSS CDN validation', () => {
        it('should warn about missing Tailwind CDN', () => {
            const html = '<!doctype html><html><head></head><body></body></html>';
            const result = validateHTML(html);
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    message: 'Missing Tailwind CSS CDN script',
                    severity: 'warning',
                })
            );
        });

        it('should pass with Tailwind CDN present', () => {
            const html = `<!doctype html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body></body>
</html>`;
            const result = validateHTML(html);
            expect(result.errors).not.toContainEqual(
                expect.objectContaining({ message: 'Missing Tailwind CSS CDN script' })
            );
        });
    });

    describe('isValid flag', () => {
        it('should be true when only warnings exist', () => {
            // Missing DOCTYPE and Tailwind are warnings, but has all required tags
            const html = '<html><head></head><body></body></html>';
            const result = validateHTML(html);
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.every(e => e.severity === 'warning')).toBe(true);
        });

        it('should be false when errors exist', () => {
            const html = '<!doctype html><html><head></head></html>'; // Missing body
            const result = validateHTML(html);
            expect(result.isValid).toBe(false);
        });
    });
});

describe('formatValidationErrors', () => {
    it('should return success message for valid HTML', () => {
        const result = { isValid: true, errors: [], suggestions: [] };
        const formatted = formatValidationErrors(result);
        expect(formatted).toBe('HTML validation passed successfully!');
    });

    it('should format errors with location info', () => {
        const result = {
            isValid: false,
            errors: [{ line: 10, column: 5, message: 'Test error', severity: 'error' as const }],
            suggestions: [],
        };
        const formatted = formatValidationErrors(result);
        expect(formatted).toContain('[ERROR]');
        expect(formatted).toContain('Line 10:5');
        expect(formatted).toContain('Test error');
    });

    it('should include suggestions', () => {
        const result = {
            isValid: false,
            errors: [{ message: 'Missing tag', severity: 'warning' as const }],
            suggestions: ['Add the missing tag'],
        };
        const formatted = formatValidationErrors(result);
        expect(formatted).toContain('Suggestions:');
        expect(formatted).toContain('Add the missing tag');
    });
});

