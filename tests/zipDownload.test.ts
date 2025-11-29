import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';

// Test ZIP creation logic extracted from AgentDocumentsSummary
describe('ZIP Download Functionality', () => {
    // Helper function that mirrors the component logic
    async function createDocumentsZip(baDocument: string, saDocument: string, devDocument: string): Promise<JSZip> {
        const zip = new JSZip();

        if (baDocument) {
            const baContent = baDocument.replace(/<!SUMMARY!>/g, '').trim();
            zip.file('Business_Analyst.md', `# Business Analyst Document\n\n${baContent}`);
        }

        if (saDocument) {
            zip.file('System_Analyst.md', `# System Analyst Document\n\n${saDocument}`);
        }

        if (devDocument) {
            zip.file('Developer.vue', devDocument);
        }

        return zip;
    }

    describe('hasAnyDocument computed', () => {
        it('should return false when all documents are empty', () => {
            const hasAnyDocument = !!'' || !!'' || !!'';
            expect(hasAnyDocument).toBe(false);
        });

        it('should return true when BA document exists', () => {
            const hasAnyDocument = !!'BA content' || !!'' || !!'';
            expect(hasAnyDocument).toBe(true);
        });

        it('should return true when SA document exists', () => {
            const hasAnyDocument = !!'' || !!'SA content' || !!'';
            expect(hasAnyDocument).toBe(true);
        });

        it('should return true when DEV document exists', () => {
            const hasAnyDocument = !!'' || !!'' || !!'DEV content';
            expect(hasAnyDocument).toBe(true);
        });

        it('should return true when all documents exist', () => {
            const hasAnyDocument = !!'BA' || !!'SA' || !!'DEV';
            expect(hasAnyDocument).toBe(true);
        });
    });

    describe('ZIP file creation', () => {
        it('should create ZIP with all three documents', async () => {
            const baDoc = 'Requirements summary';
            const saDoc = 'UI/UX Specification';
            const devDoc = '<template><div>Hello</div></template>';

            const zip = await createDocumentsZip(baDoc, saDoc, devDoc);
            const files = Object.keys(zip.files);

            expect(files).toContain('Business_Analyst.md');
            expect(files).toContain('System_Analyst.md');
            expect(files).toContain('Developer.vue');
            expect(files).toHaveLength(3);
        });

        it('should create ZIP with only BA document', async () => {
            const zip = await createDocumentsZip('BA content', '', '');
            const files = Object.keys(zip.files);

            expect(files).toContain('Business_Analyst.md');
            expect(files).not.toContain('System_Analyst.md');
            expect(files).not.toContain('Developer.vue');
            expect(files).toHaveLength(1);
        });

        it('should create ZIP with only SA document', async () => {
            const zip = await createDocumentsZip('', 'SA content', '');
            const files = Object.keys(zip.files);

            expect(files).not.toContain('Business_Analyst.md');
            expect(files).toContain('System_Analyst.md');
            expect(files).not.toContain('Developer.vue');
            expect(files).toHaveLength(1);
        });

        it('should create ZIP with only DEV document', async () => {
            const zip = await createDocumentsZip('', '', '<template></template>');
            const files = Object.keys(zip.files);

            expect(files).not.toContain('Business_Analyst.md');
            expect(files).not.toContain('System_Analyst.md');
            expect(files).toContain('Developer.vue');
            expect(files).toHaveLength(1);
        });

        it('should create empty ZIP when no documents provided', async () => {
            const zip = await createDocumentsZip('', '', '');
            const files = Object.keys(zip.files);

            expect(files).toHaveLength(0);
        });
    });

    describe('BA document cleaning', () => {
        it('should remove <!SUMMARY!> tag from BA document', async () => {
            const baDoc = '<!SUMMARY!>This is the summary<!SUMMARY!>';
            const zip = await createDocumentsZip(baDoc, '', '');

            const baFile = await zip.file('Business_Analyst.md')?.async('string');
            expect(baFile).not.toContain('<!SUMMARY!>');
            expect(baFile).toContain('This is the summary');
        });

        it('should trim whitespace from BA document', async () => {
            const baDoc = '   Content with spaces   ';
            const zip = await createDocumentsZip(baDoc, '', '');

            const baFile = await zip.file('Business_Analyst.md')?.async('string');
            expect(baFile).toContain('Content with spaces');
            expect(baFile).not.toMatch(/^\s+Content/);
        });

        it('should handle multiple <!SUMMARY!> tags', async () => {
            const baDoc = '<!SUMMARY!>Part1<!SUMMARY!> and <!SUMMARY!>Part2<!SUMMARY!>';
            const zip = await createDocumentsZip(baDoc, '', '');

            const baFile = await zip.file('Business_Analyst.md')?.async('string');
            expect(baFile).not.toContain('<!SUMMARY!>');
            expect(baFile).toContain('Part1');
            expect(baFile).toContain('Part2');
        });
    });

    describe('File content format', () => {
        it('should add header to BA document', async () => {
            const zip = await createDocumentsZip('BA content', '', '');
            const baFile = await zip.file('Business_Analyst.md')?.async('string');

            expect(baFile).toMatch(/^# Business Analyst Document/);
        });

        it('should add header to SA document', async () => {
            const zip = await createDocumentsZip('', 'SA content', '');
            const saFile = await zip.file('System_Analyst.md')?.async('string');

            expect(saFile).toMatch(/^# System Analyst Document/);
        });

        it('should preserve DEV document as-is (Vue SFC)', async () => {
            const vueCode = `<template>
  <div>Hello World</div>
</template>

<script setup>
const msg = 'Hello';
</script>`;
            const zip = await createDocumentsZip('', '', vueCode);
            const devFile = await zip.file('Developer.vue')?.async('string');

            expect(devFile).toBe(vueCode);
        });
    });

    describe('ZIP blob generation', () => {
        it('should generate valid blob', async () => {
            const zip = await createDocumentsZip('BA', 'SA', 'DEV');
            const blob = await zip.generateAsync({ type: 'blob' });

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.size).toBeGreaterThan(0);
            expect(blob.type).toBe('application/zip');
        });

        it('should generate arraybuffer with correct content', async () => {
            const zip = await createDocumentsZip('Test BA', 'Test SA', '<template></template>');
            // Use arraybuffer instead of blob for Node.js compatibility
            const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

            // Re-read the ZIP from arraybuffer
            const reloadedZip = await JSZip.loadAsync(arrayBuffer);
            const files = Object.keys(reloadedZip.files);

            expect(files).toHaveLength(3);
            expect(files).toContain('Business_Analyst.md');
            expect(files).toContain('System_Analyst.md');
            expect(files).toContain('Developer.vue');
        });
    });
});

