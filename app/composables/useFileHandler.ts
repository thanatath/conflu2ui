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

    return {
        uploadFiles,
        readFileAsText,
        readFileAsBase64,
    };
}
