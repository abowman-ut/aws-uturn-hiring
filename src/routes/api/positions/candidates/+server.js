import { dynamoOperation, CANDIDATES_TABLE } from '$lib/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { json } from '@sveltejs/kit';

// GET /api/positions/candidates?positionId=xxx
export async function GET({ url }) {
    try {
        const positionId = url.searchParams.get('positionId');
        
        if (!positionId) {
            return json({ error: 'Position ID is required' }, { status: 400 });
        }

        // Get all candidates for this position
        const result = await dynamoOperation(ScanCommand, {
            tableName: CANDIDATES_TABLE,
            FilterExpression: 'positionId = :positionId',
            ExpressionAttributeValues: {
                ':positionId': positionId
            }
        });

        const candidates = result.Items || [];

        // Count candidates in each stage
        const counts = {
            total: candidates.length,
            stages: {
                cv_review: 0,
                culture_fit: 0,
                interview: 0
            }
        };

        // Count candidates in each stage
        candidates.forEach(candidate => {
            const currentStage = candidate.stages[candidate.stages.length - 1];
            if (currentStage && counts.stages.hasOwnProperty(currentStage.id)) {
                counts.stages[currentStage.id]++;
            }
        });

        return json(counts);
    } catch (error) {
        console.error('Error getting candidate counts:', error);
        return json({ error: 'Failed to get candidate counts' }, { status: 500 });
    }
} 