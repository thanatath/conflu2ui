import mammoth from 'mammoth';
import TurndownService from 'turndown';

export function useFileHandler() {
    async function uploadFiles(files: File[]): Promise<Array<{ filename: string; content: string; type: string }>> {
        const formData = new FormData();

        for (const file of files) {
            formData.append('files', file);
        }

        try {
            const response = await fetch('/api/upload/file', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            return result.files;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    function readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target?.result as string);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    function readFileAsBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target?.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target?.result as ArrayBuffer);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async function convertDocxToMarkdown(file: File): Promise<string> {
        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);

            // Convert DOCX to HTML using mammoth
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const html = result.value;

            // Convert HTML to Markdown using Turndown
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                bulletListMarker: '-',
            });

            const markdown = turndownService.turndown(html);

            // Log any warnings from mammoth
            if (result.messages.length > 0) {
                console.warn('Mammoth conversion warnings:', result.messages);
            }

            return markdown;
        } catch (error) {
            console.error('Error converting DOCX to Markdown:', error);
            throw new Error(`Failed to convert Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    function isWordDocument(file: File): boolean {
        const wordMimeTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
        ];
        const wordExtensions = ['.doc', '.docx'];

        return wordMimeTypes.includes(file.type) ||
            wordExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }

    async function readFileContent(file: File): Promise<string> {
        // Check if it's a Word document
        if (isWordDocument(file)) {
            return await convertDocxToMarkdown(file);
        }

        // Default: read as text (for .md, .txt files)
        return await readFileAsText(file);
    }

    return {
        uploadFiles,
        readFileAsText,
        readFileAsBase64,
        readFileAsArrayBuffer,
        convertDocxToMarkdown,
        isWordDocument,
        readFileContent,
    };
}
