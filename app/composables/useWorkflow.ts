import type { WorkflowStep, WorkflowContext } from '../types/workflow';

export function useWorkflow() {
    const currentStep = useState<WorkflowStep>('workflow-step', () => 'upload-story');

    const context = useState<WorkflowContext>('workflow-context', () => ({
        userStory: '',
        images: [],
        baDocument: '',
        saDocument: '',
        htmlPrototype: '',
        validationErrors: [],
    }));

    const isLoading = useState('workflow-loading', () => false);

    function setStep(step: WorkflowStep) {
        currentStep.value = step;
    }

    function nextStep() {
        const steps: WorkflowStep[] = [
            'upload-story',
            'upload-images',
            'ba-conversation',
            'ba-confirmation',
            'sa-design',
            'dev-implementation',
            'validation',
            'preview',
            'iteration',
        ];

        const currentIndex = steps.indexOf(currentStep.value);
        if (currentIndex < steps.length - 1) {
            currentStep.value = steps[currentIndex + 1];
        }
    }

    function updateContext(updates: Partial<WorkflowContext>) {
        context.value = { ...context.value, ...updates };
    }

    async function uploadUserStory(content: string) {
        updateContext({ userStory: content });
        const { setContext } = useAgentChat();
        setContext('ba', content);
    }

    async function uploadImages(images: string[]) {
        updateContext({ images });
    }

    async function handoffToSA(baDocument: string) {
        updateContext({ baDocument });
        const { setContext, activateAgent } = useAgentChat();
        setContext('sa', baDocument);
        activateAgent('sa');
    }

    async function handoffToDev(saDocument: string) {
        updateContext({ saDocument });
        const { setContext, activateAgent } = useAgentChat();
        setContext('dev', saDocument);
        activateAgent('dev');
    }

    async function validatePrototype(html: string): Promise<boolean> {
        try {
            const response = await fetch('/api/validate/html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html }),
            });

            const result = await response.json();

            if (!result.isValid) {
                updateContext({ validationErrors: result.errors });
                return false;
            }

            updateContext({ htmlPrototype: html, validationErrors: [] });
            return true;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    return {
        currentStep,
        context,
        isLoading,
        setStep,
        nextStep,
        updateContext,
        uploadUserStory,
        uploadImages,
        handoffToSA,
        handoffToDev,
        validatePrototype,
    };
}
