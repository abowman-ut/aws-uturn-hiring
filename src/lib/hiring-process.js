// Define the stages in order
export const STAGES = [
    { id: 'cv_review', name: 'CV Review', icon: 'bi-file-text', description: 'Initial review of candidate\'s CV and qualifications' },
    { id: 'culture_fit', name: 'Culture Fit', icon: 'bi-person-check', description: 'Assessment of cultural alignment and soft skills' },
    { id: 'interview', name: 'Interview', icon: 'bi-code-square', description: 'Technical and behavioral interview process' },
    { id: 'decision', name: 'Decision', icon: 'bi-check-square', description: 'Final hiring decision' }
];

// Helper functions for stage management
export function getInitialStage() {
    return {
        ...STAGES[0],
        status: 'current',
        startDate: new Date().toISOString(),
        decisionMaker: '',
        notes: ''
    };
}

export function getNextStage(currentStageId) {
    const currentIndex = STAGES.findIndex(s => s.id === currentStageId);
    if (currentIndex === -1 || currentIndex === STAGES.length - 1) return null;
    return STAGES[currentIndex + 1];
}

export function isLastStage(stageId) {
    return stageId === STAGES[STAGES.length - 1].id;
}

export function isDecisionStage(stageId) {
    return stageId === 'decision';
}

export function getStageById(stageId) {
    return STAGES.find(s => s.id === stageId);
}

export function getStageStatus(stages, stageId) {
    if (!stages) return 'pending';
    const stage = stages.find(s => s.id === stageId);
    return stage?.status || 'pending';
}

export function getStageClass(stage) {
    if (!stage) return '';

    if (stage.status === 'completed') {
        return stage.outcome === 'reject' ? 'completed reject' : 'completed';
    }

    if (stage.status === 'current') {
        return 'current';
    }

    return 'pending';
}

// Constants for stage outcomes
export const OUTCOMES = {
    PASS: 'pass',
    REJECT: 'reject',
    HIRE: 'hire'
};

// Constants for stage statuses
export const STATUSES = {
    CURRENT: 'current',
    COMPLETED: 'completed',
    PENDING: 'pending'
}; 