import { dynamoOperation, CANDIDATES_TABLE } from '$lib/dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { json } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { STAGES, OUTCOMES, STATUSES } from '$lib/hiring-process';

const ROLES = [
    'Software Engineer',
    'Product Manager',
    'UX Designer',
    'DevOps Engineer',
    'Data Scientist',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer'
];

const DECISION_MAKERS = [
    'Sarah Johnson',
    'Michael Chen',
    'Emily Rodriguez',
    'David Kim',
    'Lisa Patel',
    'James Wilson',
    'Maria Garcia',
    'Alex Thompson'
];

function generateRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function generateStages(candidateId, currentStageId) {
    const stages = [];
    const currentStageIndex = STAGES.findIndex(s => s.id === currentStageId);
    
    // Add completed stages
    for (let i = 0; i < currentStageIndex; i++) {
        const stage = STAGES[i];
        const startDate = generateRandomDate(new Date('2024-01-01'), new Date('2024-03-01'));
        const endDate = generateRandomDate(new Date(startDate), new Date());
        
        stages.push({
            ...stage,
            status: STATUSES.COMPLETED,
            startDate,
            endDate,
            decisionMaker: DECISION_MAKERS[Math.floor(Math.random() * DECISION_MAKERS.length)],
            notes: `Completed ${stage.name} stage with positive feedback.`,
            outcome: OUTCOMES.PASS
        });
    }
    
    // Add current stage
    if (currentStageId !== 'rejected') {
        const currentStage = STAGES[currentStageIndex];
        stages.push({
            ...currentStage,
            status: STATUSES.CURRENT,
            startDate: generateRandomDate(new Date('2024-03-01'), new Date()),
            decisionMaker: '',
            notes: ''
        });
    }
    
    return stages;
}

async function generateTestData() {
    const candidates = [];
    const now = new Date();

    // Generate 20 candidates
    for (let i = 0; i < 20; i++) {
        const id = uuidv4();
        const role = ROLES[Math.floor(Math.random() * ROLES.length)];
        const createdAt = generateRandomDate(new Date('2024-01-01'), now);
        const updatedAt = generateRandomDate(new Date(createdAt), now);
        
        // Distribute candidates across different stages
        let currentStageId;
        const stageDistribution = Math.random();
        
        if (stageDistribution < 0.3) {
            currentStageId = 'cv_review'; // 30% in CV review
        } else if (stageDistribution < 0.6) {
            currentStageId = 'culture_fit'; // 30% in culture fit
        } else if (stageDistribution < 0.8) {
            currentStageId = 'interview'; // 20% in interview
        } else if (stageDistribution < 0.9) {
            // For hired candidates, they're in the interview stage with a 'pass' outcome
            currentStageId = 'interview';
            const stages = generateStages(id, currentStageId);
            const interviewStage = stages.find(s => s.id === 'interview');
            if (interviewStage) {
                interviewStage.status = 'completed';
                interviewStage.outcome = 'pass';
                interviewStage.endDate = new Date().toISOString();
                interviewStage.decisionMaker = DECISION_MAKERS[Math.floor(Math.random() * DECISION_MAKERS.length)];
                interviewStage.notes = 'Candidate hired after successful interview.';
            }
        } else {
            // For rejected candidates, they're in the interview stage with a 'reject' outcome
            currentStageId = 'interview';
            const stages = generateStages(id, currentStageId);
            const interviewStage = stages.find(s => s.id === 'interview');
            if (interviewStage) {
                interviewStage.status = 'completed';
                interviewStage.outcome = 'reject';
                interviewStage.endDate = new Date().toISOString();
                interviewStage.decisionMaker = DECISION_MAKERS[Math.floor(Math.random() * DECISION_MAKERS.length)];
                interviewStage.notes = 'Candidate rejected after interview.';
            }
        }

        const stages = generateStages(id, currentStageId);
        
        const candidate = {
            id,
            name: `Candidate ${i + 1}`,
            email: `candidate${i + 1}@example.com`,
            role,
            status: currentStageId,
            stages,
            createdAt,
            updatedAt
        };

        candidates.push(candidate);
    }

    // Save candidates to DynamoDB
    for (const candidate of candidates) {
        await dynamoOperation(PutCommand, {
            tableName: CANDIDATES_TABLE,
            Item: candidate
        });
    }

    return candidates;
}

export async function GET() {
    try {
        const candidates = await generateTestData();
        return json({ message: 'Test data generated successfully', count: candidates.length });
    } catch (error) {
        console.error('Error generating test data:', error);
        return json({ error: 'Failed to generate test data' }, { status: 500 });
    }
} 