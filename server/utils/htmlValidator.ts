import { parseDocument } from 'htmlparser2';
import type { ValidationResult, ValidationError } from '../../types/workflow';

export function validateHTML(html: string): ValidationResult {
    const errors: ValidationError[] = [];
    const suggestions: string[] = [];

    try {
        // Basic checks
        if (!html.trim()) {
            errors.push({
                message: 'HTML content is empty',
                severity: 'error',
            });
            return { isValid: false, errors, suggestions };
        }

        // Check for DOCTYPE
        if (!html.toLowerCase().includes('<!doctype html>')) {
            errors.push({
                message: 'Missing <!DOCTYPE html> declaration',
                severity: 'warning',
            });
            suggestions.push('Add <!DOCTYPE html> at the start of the document');
        }

        // Parse HTML
        const document = parseDocument(html, {
            lowerCaseAttributeNames: false,
            recognizeSelfClosing: true,
        });

        // Check for required elements
        let hasHtml = false;
        let hasHead = false;
        let hasBody = false;
        let hasTailwind = false;

        function traverse(node: any) {
            if (node.type === 'tag') {
                if (node.name === 'html') hasHtml = true;
                if (node.name === 'head') hasHead = true;
                if (node.name === 'body') hasBody = true;

                // Check for Tailwind CDN
                if (node.name === 'script' && node.attribs?.src?.includes('tailwindcss.com')) {
                    hasTailwind = true;
                }
            }

            if (node.children) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        }

        for (const node of document.children) {
            traverse(node);
        }

        if (!hasHtml) {
            errors.push({
                message: 'Missing <html> tag',
                severity: 'error',
            });
        }

        if (!hasHead) {
            errors.push({
                message: 'Missing <head> tag',
                severity: 'error',
            });
        }

        if (!hasBody) {
            errors.push({
                message: 'Missing <body> tag',
                severity: 'error',
            });
        }

        if (!hasTailwind) {
            errors.push({
                message: 'Missing Tailwind CSS CDN script',
                severity: 'warning',
            });
            suggestions.push('Add <script src="https://cdn.tailwindcss.com"></script> in the head');
        }

        // Check for unclosed tags (basic check)
        const openingTags = html.match(/<[a-z][^>]*>/gi) || [];
        const closingTags = html.match(/<\/[a-z][^>]*>/gi) || [];
        const selfClosingTags = html.match(/<[a-z][^>]*\/>/gi) || [];

        // Very basic heuristic - not perfect but catches obvious issues
        const expectedClosing = openingTags.length - selfClosingTags.length;
        if (closingTags.length < expectedClosing * 0.8) {
            errors.push({
                message: 'Potential unclosed tags detected',
                severity: 'warning',
            });
            suggestions.push('Verify all opening tags have corresponding closing tags');
        }

    } catch (error) {
        errors.push({
            message: `HTML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
        });
    }

    const isValid = errors.filter(e => e.severity === 'error').length === 0;

    return {
        isValid,
        errors,
        suggestions,
    };
}

export function formatValidationErrors(result: ValidationResult): string {
    if (result.isValid && result.errors.length === 0) {
        return 'HTML validation passed successfully!';
    }

    let output = 'HTML Validation Results:\n\n';

    if (result.errors.length > 0) {
        output += 'Errors:\n';
        for (const error of result.errors) {
            const location = error.line ? `Line ${error.line}${error.column ? `:${error.column}` : ''}` : 'Unknown location';
            output += `  [${error.severity.toUpperCase()}] ${location}: ${error.message}\n`;
        }
        output += '\n';
    }

    if (result.suggestions.length > 0) {
        output += 'Suggestions:\n';
        for (const suggestion of result.suggestions) {
            output += `  - ${suggestion}\n`;
        }
    }

    return output;
}
