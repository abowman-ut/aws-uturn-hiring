import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { json } from '@sveltejs/kit';

const s3Client = new S3Client({
    region: process.env.MY_AWS_REGION || 'us-east-2',
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = import.meta.env.DEV ? 'uturn-resumes-local' : 'uturn-resumes';

// GET /api/candidates/notes?candidateId=...
export async function GET({ url }) {
    try {
        const candidateId = url.searchParams.get('candidateId');
        
        if (!candidateId) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }

        const key = `notes/${candidateId}/notes.json`;

        try {
            // Try to get existing notes
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key
            });

            const response = await s3Client.send(command);
            const notesData = await response.Body.transformToString();
            const data = JSON.parse(notesData);

            return json({ 
                notes: data.notes || '',
                key: key
            });
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                // No notes exist yet, return empty
                return json({ 
                    notes: '',
                    key: key
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error getting notes:', error);
        return json({ 
            error: 'Failed to get notes',
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/candidates/notes
export async function POST({ request }) {
    try {
        const { candidateId, notes, key } = await request.json();
        
        if (!candidateId) {
            return json({ error: 'Candidate ID is required' }, { status: 400 });
        }

        // Generate key if not provided
        const notesKey = key || `notes/${candidateId}/notes.json`;
        
        // Create notes data object
        const notesData = {
            candidateId,
            notes: notes || '',
            updatedAt: new Date().toISOString()
        };

        // Create the S3 put object command
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: notesKey,
            Body: JSON.stringify(notesData),
            ContentType: 'application/json',
            ACL: 'private'
        });

        // Upload notes to S3
        await s3Client.send(command);

        return json({
            key: notesKey,
            message: 'Notes saved successfully'
        });
    } catch (error) {
        console.error('Error saving notes:', error);
        return json({ 
            error: 'Failed to save notes',
            details: error.message 
        }, { status: 500 });
    }
} 