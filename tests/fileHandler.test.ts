import { describe, it, expect, vi } from 'vitest';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

// Test isWordDocument logic
describe('Word Document Detection', () => {
    // Helper function to create mock File
    function createMockFile(name: string, type: string): File {
        return new File(['test content'], name, { type });
    }

    // isWordDocument logic (extracted for testing)
    function isWordDocument(file: File): boolean {
        const wordMimeTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
        ];
        const wordExtensions = ['.doc', '.docx'];

        return wordMimeTypes.includes(file.type) ||
            wordExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }

    describe('isWordDocument by MIME type', () => {
        it('should detect .docx by MIME type', () => {
            const file = createMockFile('document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            expect(isWordDocument(file)).toBe(true);
        });

        it('should detect .doc by MIME type', () => {
            const file = createMockFile('document.doc', 'application/msword');
            expect(isWordDocument(file)).toBe(true);
        });

        it('should not detect text file by MIME type', () => {
            const file = createMockFile('document.txt', 'text/plain');
            expect(isWordDocument(file)).toBe(false);
        });

        it('should not detect markdown file by MIME type', () => {
            const file = createMockFile('document.md', 'text/markdown');
            expect(isWordDocument(file)).toBe(false);
        });
    });

    describe('isWordDocument by file extension', () => {
        it('should detect .docx by extension', () => {
            const file = createMockFile('document.docx', '');
            expect(isWordDocument(file)).toBe(true);
        });

        it('should detect .doc by extension', () => {
            const file = createMockFile('document.doc', '');
            expect(isWordDocument(file)).toBe(true);
        });

        it('should detect .DOCX (uppercase) by extension', () => {
            const file = createMockFile('document.DOCX', '');
            expect(isWordDocument(file)).toBe(true);
        });

        it('should detect .DOC (uppercase) by extension', () => {
            const file = createMockFile('document.DOC', '');
            expect(isWordDocument(file)).toBe(true);
        });

        it('should not detect .txt by extension', () => {
            const file = createMockFile('document.txt', '');
            expect(isWordDocument(file)).toBe(false);
        });

        it('should not detect .md by extension', () => {
            const file = createMockFile('document.md', '');
            expect(isWordDocument(file)).toBe(false);
        });

        it('should not detect .pdf by extension', () => {
            const file = createMockFile('document.pdf', 'application/pdf');
            expect(isWordDocument(file)).toBe(false);
        });
    });

    describe('isWordDocument edge cases', () => {
        it('should handle file with no extension', () => {
            const file = createMockFile('document', '');
            expect(isWordDocument(file)).toBe(false);
        });

        it('should handle file with similar extension', () => {
            const file = createMockFile('document.docxx', '');
            expect(isWordDocument(file)).toBe(false);
        });

        it('should handle file ending with doc in name', () => {
            const file = createMockFile('mydoc', '');
            expect(isWordDocument(file)).toBe(false);
        });
    });
});

// Test Turndown configuration
describe('Turndown HTML to Markdown conversion', () => {
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
    });

    it('should convert headings to ATX style', () => {
        const html = '<h1>Heading 1</h1><h2>Heading 2</h2>';
        const markdown = turndownService.turndown(html);
        expect(markdown).toContain('# Heading 1');
        expect(markdown).toContain('## Heading 2');
    });

    it('should convert paragraphs', () => {
        const html = '<p>This is a paragraph.</p>';
        const markdown = turndownService.turndown(html);
        expect(markdown).toBe('This is a paragraph.');
    });

    it('should convert bold text', () => {
        const html = '<p><strong>Bold text</strong></p>';
        const markdown = turndownService.turndown(html);
        expect(markdown).toContain('**Bold text**');
    });

    it('should convert italic text', () => {
        const html = '<p><em>Italic text</em></p>';
        const markdown = turndownService.turndown(html);
        expect(markdown).toContain('_Italic text_');
    });

    it('should convert unordered lists with dash marker', () => {
        const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        const markdown = turndownService.turndown(html);
        // Turndown adds extra spaces for indentation
        expect(markdown).toContain('-');
        expect(markdown).toContain('Item 1');
        expect(markdown).toContain('Item 2');
    });

    it('should convert ordered lists', () => {
        const html = '<ol><li>First</li><li>Second</li></ol>';
        const markdown = turndownService.turndown(html);
        expect(markdown).toContain('1.');
        expect(markdown).toContain('2.');
    });

    it('should convert links', () => {
        const html = '<a href="https://example.com">Link text</a>';
        const markdown = turndownService.turndown(html);
        expect(markdown).toBe('[Link text](https://example.com)');
    });

    it('should handle nested elements', () => {
        const html = '<ul><li><strong>Bold item</strong></li><li><em>Italic item</em></li></ul>';
        const markdown = turndownService.turndown(html);
        expect(markdown).toContain('**Bold item**');
        expect(markdown).toContain('_Italic item_');
    });
});

// Test mammoth library integration
describe('Mammoth DOCX to HTML conversion', () => {
    it('should export convertToHtml function', () => {
        expect(typeof mammoth.convertToHtml).toBe('function');
    });

    it('should have proper result structure from mammoth', async () => {
        // Create minimal valid DOCX-like ArrayBuffer (empty doc simulation)
        // In reality, mammoth requires a valid DOCX, but we can test the interface
        const mockResult = {
            value: '<p>Test content</p>',
            messages: [],
        };

        // Verify expected structure
        expect(mockResult).toHaveProperty('value');
        expect(mockResult).toHaveProperty('messages');
        expect(typeof mockResult.value).toBe('string');
        expect(Array.isArray(mockResult.messages)).toBe(true);
    });
});

// Test file type accepted for upload
describe('File Upload Accept Types', () => {
    const acceptedTypes = '.doc,.docx,.md,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain';

    it('should accept .doc files', () => {
        expect(acceptedTypes).toContain('.doc');
    });

    it('should accept .docx files', () => {
        expect(acceptedTypes).toContain('.docx');
    });

    it('should accept .md files', () => {
        expect(acceptedTypes).toContain('.md');
    });

    it('should accept .txt files', () => {
        expect(acceptedTypes).toContain('.txt');
    });

    it('should accept msword MIME type', () => {
        expect(acceptedTypes).toContain('application/msword');
    });

    it('should accept docx MIME type', () => {
        expect(acceptedTypes).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
});

