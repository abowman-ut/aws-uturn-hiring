import { dynamoOperation, CANDIDATES_TABLE } from '$lib/dynamodb';
import { GetCommand, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { json } from '@sveltejs/kit';
import { getInitialStage } from '$lib/hiring-process';

// Validate candidate data
function validateCandidate(candidate) {
    const errors = [];
    
    // Required fields
    if (!candidate.name) errors.push('Name is required');
    if (!candidate.email) errors.push('Email is required');
    if (!candidate.positionId) errors.push('Position ID is required');
    if (!candidate.expectedSalary) errors.push('Expected salary is required');
    if (!candidate.source) errors.push('Source is required');
    if (!candidate.sourceName) errors.push('Source name is required');
    
    // Validate email format
    if (candidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
        errors.push('Invalid email format');
    }
    
    // Validate salary
    if (candidate.expectedSalary) {
        const { amount, currency } = candidate.expectedSalary;
        if (!amount || !currency) {
            errors.push('Salary must include amount and currency');
        } else if (isNaN(amount) || amount <= 0) {
            errors.push('Salary amount must be a positive number');
        }
    }
    
    // Validate source
    if (candidate.source && !['recruiter', 'referral'].includes(candidate.source)) {
        errors.push('Source must be either "recruiter" or "referral"');
    }

    // Validate resume if provided
    if (candidate.resume) {
        if (!candidate.resume.url) {
            errors.push('Resume URL is required if resume is provided');
        }
        if (!candidate.resume.filename) {
            errors.push('Resume filename is required if resume is provided');
        }
    }
    
    return errors;
}

// GET /api/candidates
export async function GET({ url }) {
    try {
        const id = url.searchParams.get('id');
        
        if (id) {
            // Get single candidate
            const result = await dynamoOperation(GetCommand, {
                tableName: CANDIDATES_TABLE,
                Key: { id }
            });
            
            if (!result.Item) {
                return json({ error: 'Candidate not found' }, { status: 404 });
            }
            
            return json(result.Item);
        } else {
            // List all candidates
            const result = await dynamoOperation(ScanCommand, {
                tableName: CANDIDATES_TABLE
            });
            
            return json(result.Items || []);
        }
    } catch (error) {
        console.error('Error in candidates GET:', error);
        return json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }
}

// POST /api/candidates
export async function POST({ request }) {
    try {
        const candidate = await request.json();
        
        // Validate candidate data
        const errors = validateCandidate(candidate);
        if (errors.length > 0) {
            return json({ error: 'Validation failed', details: errors }, { status: 400 });
        }
        
        // Generate ID if not provided
        if (!candidate.id) {
            candidate.id = crypto.randomUUID();
        }
        
        // Add timestamps
        candidate.createdAt = new Date().toISOString();
        candidate.updatedAt = candidate.createdAt;

        // Initialize stages array with the initial stage
        candidate.stages = [getInitialStage()];

        // Initialize resume if not provided
        if (!candidate.resume) {
            candidate.resume = null;
        }
        
        await dynamoOperation(PutCommand, {
            tableName: CANDIDATES_TABLE,
            Item: candidate
        });
        
        return json(candidate);
    } catch (error) {
        console.error('Error in candidates POST:', error);
        return json({ error: 'Failed to create candidate' }, { status: 500 });
    }
}

// PUT /api/candidates
export async function PUT({ request }) {
    try {
        const candidate = await request.json();
        
        if (!candidate.id) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }
        
        // Validate candidate data
        const errors = validateCandidate(candidate);
        if (errors.length > 0) {
            return json({ error: 'Validation failed', details: errors }, { status: 400 });
        }
        
        // Update timestamp
        candidate.updatedAt = new Date().toISOString();
        
        await dynamoOperation(PutCommand, {
            tableName: CANDIDATES_TABLE,
            Item: candidate
        });
        
        return json(candidate);
    } catch (error) {
        console.error('Error in candidates PUT:', error);
        return json({ error: 'Failed to update candidate' }, { status: 500 });
    }
}

// DELETE /api/candidates
export async function DELETE({ url }) {
    try {
        const id = url.searchParams.get('id');
        
        if (!id) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }
        
        await dynamoOperation(DeleteCommand, {
            tableName: CANDIDATES_TABLE,
            Key: { id }
        });
        
        return json({ success: true });
    } catch (error) {
        console.error('Error in candidates DELETE:', error);
        return json({ error: 'Failed to delete candidate' }, { status: 500 });
    }
} 