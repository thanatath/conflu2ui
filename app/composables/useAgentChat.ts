import type { AgentRole, AgentSession, Message } from '../types/workflow';

export function useAgentChat() {
    // Separate sessions for each agent
    const sessions = useState<Record<AgentRole, AgentSession>>('agent-sessions', () => ({
        ba: {
            role: 'ba',
            messages: [],
            context: '',
            isActive: true,
            status: 'idle',
        },
        sa: {
            role: 'sa',
            messages: [],
            context: '',
            isActive: false,
            status: 'idle',
        },
        dev: {
            role: 'dev',
            messages: [],
            context: '',
            isActive: false,
            status: 'idle',
        },
    }));

    const currentAgent = computed(() => {
        return Object.values(sessions.value).find(s => s.isActive)?.role || 'ba';
    });

    function addMessage(role: AgentRole, message: Message) {
        sessions.value[role].messages.push(message);
    }

    function setAgentStatus(role: AgentRole, status: AgentSession['status']) {
        sessions.value[role].status = status;
    }

    function activateAgent(role: AgentRole) {
        // Deactivate all agents
        Object.keys(sessions.value).forEach((key) => {
            sessions.value[key as AgentRole].isActive = false;
        });
        // Activate the specified agent
        sessions.value[role].isActive = true;
    }

    function setContext(role: AgentRole, context: string) {
        sessions.value[role].context = context;
    }

    function getSession(role: AgentRole): AgentSession {
        return sessions.value[role];
    }

    function clearMessages(role: AgentRole) {
        sessions.value[role].messages = [];
    }

    function removeLastMessage(role: AgentRole) {
        const messages = sessions.value[role].messages;
        if (messages.length > 0) {
            messages.pop();
        }
    }

    return {
        sessions,
        currentAgent,
        addMessage,
        setAgentStatus,
        activateAgent,
        setContext,
        getSession,
        clearMessages,
        removeLastMessage,
    };
}
