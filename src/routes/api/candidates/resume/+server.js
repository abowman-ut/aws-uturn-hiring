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

// GET /api/candidates/resume?key=...
export async function GET({ url }) {
    try {
        const key = url.searchParams.get('key');
        
        if (!key) {
            return json({ error: 'Resume key is required' }, { status: 400 });
        }

        // Create the S3 get object command with response-content-disposition header
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: 'inline',
            ResponseContentType: key.endsWith('.pdf') ? 'application/pdf' : 
                               key.endsWith('.doc') ? 'application/msword' : 
                               key.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                               'application/octet-stream'
        });

        // Generate a presigned URL for viewing
        const presignedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 3600 // URL expires in 1 hour
        });

        return json({ 
            url: presignedUrl,
            filename: key.split('/').pop(),
            contentType: command.input.ResponseContentType
        });
    } catch (error) {
        console.error('Error generating view URL:', error);
        return json({ 
            error: 'Failed to generate view URL',
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/candidates/resume
export async function POST({ request }) {
    try {
        const { filename, contentType } = await request.json();
        
        if (!filename || !contentType) {
            return json({ error: 'Filename and content type are required' }, { status: 400 });
        }

        // Generate a unique key for the file
        const key = `resumes/${crypto.randomUUID()}/${filename}`;

        // Create the S3 put object command with proper configuration
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            ACL: 'private'
        });

        // Generate a presigned URL for uploading
        const presignedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 3600
        });

        // Construct the final URL that will be used to access the file
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.MY_AWS_REGION || 'us-east-2'}.amazonaws.com/${key}`;

        return json({
            uploadUrl: presignedUrl,
            fileUrl,
            key
        });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return json({ 
            error: 'Failed to generate upload URL',
            details: error.message 
        }, { status: 500 });
    }
} 