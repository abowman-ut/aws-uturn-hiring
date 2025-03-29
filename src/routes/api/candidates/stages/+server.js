import { dynamoOperation, CANDIDATES_TABLE } from '$lib/dynamodb';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { json } from '@sveltejs/kit';
import { STAGES, OUTCOMES, STATUSES, getStageById, getNextStage, isLastStage, isDecisionStage } from '$lib/hiring-process';

// GET /api/candidates/stages
export async function GET() {
    return json(STAGES);
}

// POST /api/candidates/stages
export async function POST({ request }) {
    try {
        const { candidateId, stageId, decisionMaker, notes } = await request.json();
        console.log('Creating new stage:', { candidateId, stageId });

        // Validate stage
        const stage = getStageById(stageId);
        if (!stage) {
            console.error('Invalid stage:', stageId);
            return json({ error: 'Invalid stage' }, { status: 400 });
        }

        // Get current candidate
        const result = await dynamoOperation(GetCommand, {
            tableName: CANDIDATES_TABLE,
            Key: { id: candidateId }
        });

        if (!result.Item) {
            console.error('Candidate not found:', candidateId);
            return json({ error: 'Candidate not found' }, { status: 404 });
        }

        const candidate = result.Item;

        // Initialize stages array if it doesn't exist
        if (!candidate.stages) {
            candidate.stages = [];
        }

        // Find the current stage index
        const currentStageIndex = candidate.stages.findIndex(s => s.status === STATUSES.CURRENT);
        if (currentStageIndex === -1) {
            console.error('No current stage found for candidate:', candidateId);
            return json({ error: 'No current stage found' }, { status: 400 });
        }

        // Update the current stage to completed with a pass outcome
        candidate.stages[currentStageIndex] = {
            ...candidate.stages[currentStageIndex],
            status: STATUSES.COMPLETED,
            endDate: new Date().toISOString(),
            decisionMaker,
            notes,
            outcome: OUTCOMES.PASS
        };

        // Add new stage
        const newStage = {
            ...stage,
            status: STATUSES.CURRENT,
            startDate: new Date().toISOString(),
            decisionMaker: '',
            notes: ''
        };

        candidate.stages.push(newStage);
        console.log('Added new stage:', newStage);

        // Update candidate status to the new stage
        candidate.status = stageId;

        // Update timestamp
        candidate.updatedAt = new Date().toISOString();

        // Save updated candidate
        await dynamoOperation(PutCommand, {
            tableName: CANDIDATES_TABLE,
            Item: candidate
        });

        console.log('Successfully updated candidate with new stage');
        return json(candidate);
    } catch (error) {
        console.error('Error in stages POST:', error);
        return json({ error: 'Failed to update candidate stage' }, { status: 500 });
    }
}

// PUT /api/candidates/stages
export async function PUT({ request }) {
    try {
        const { candidateId, stageId, decisionMaker, notes, outcome } = await request.json();
        console.log('Updating stage:', { candidateId, stageId, outcome });

        // Get current candidate
        const result = await dynamoOperation(GetCommand, {
            tableName: CANDIDATES_TABLE,
            Key: { id: candidateId }
        });

        if (!result.Item) {
            console.error('Candidate not found:', candidateId);
            return json({ error: 'Candidate not found' }, { status: 404 });
        }

        const candidate = result.Item;

        // Find and update the stage
        const stageIndex = candidate.stages.findIndex(s => s.id === stageId);
        if (stageIndex === -1) {
            console.error('Stage not found:', stageId);
            return json({ error: 'Stage not found' }, { status: 404 });
        }

        // Update stage
        candidate.stages[stageIndex] = {
            ...candidate.stages[stageIndex],
            decisionMaker,
            notes,
            outcome,
            status: STATUSES.COMPLETED,
            endDate: new Date().toISOString()
        };

        // If passing and not in decision stage, add next stage
        if (outcome === OUTCOMES.PASS && !isDecisionStage(stageId)) {
            const nextStage = getNextStage(stageId);
            if (nextStage) {
                candidate.stages.push({
                    ...nextStage,
                    status: STATUSES.CURRENT,
                    startDate: new Date().toISOString(),
                    decisionMaker: '',
                    notes: ''
                });
                candidate.status = nextStage.id;
            }
        } else if (isDecisionStage(stageId)) {
            // In decision stage, outcome can be hire or reject
            candidate.status = outcome === OUTCOMES.HIRE ? 'hired' : 'rejected';
        } else if (outcome === OUTCOMES.REJECT) {
            // If rejected in any other stage
            candidate.status = 'rejected';
        } else {
            // For other stages, keep the current stage as status
            candidate.status = stageId;
        }

        // Update timestamp
        candidate.updatedAt = new Date().toISOString();

        // Save updated candidate
        await dynamoOperation(PutCommand, {
            tableName: CANDIDATES_TABLE,
            Item: candidate
        });

        console.log('Successfully updated candidate stage');
        return json(candidate);
    } catch (error) {
        console.error('Error in stages PUT:', error);
        return json({ error: 'Failed to update candidate stage' }, { status: 500 });
    }
} 