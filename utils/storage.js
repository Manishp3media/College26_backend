import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { finished } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class StorageService {
    constructor() {
        if (process.env.NODE_ENV === 'production') {
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                }
            });
        }
    }

    async saveImage(file, folder) {
        if (!file || typeof file.createReadStream !== 'function') {
            throw new Error('Invalid file upload. File must be a valid Upload object.');
        }

        try {
            const stream = file.createReadStream();
            const uniqueFilename = `${Date.now()}-${file.filename}`;

            if (process.env.NODE_ENV === 'production') {
                return await this.saveToS3(stream, uniqueFilename, folder);
            } else {
                return await this.saveToLocal(stream, uniqueFilename, folder);
            }
        } catch (error) {
            console.error('❌ Error in saveImage:', error);
            throw new Error(`Failed to save image: ${error.message}`);
        }
    }

    async saveToS3(stream, filename, folder) {
        try {
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);
            const key = `${folder}/${filename}`;

            const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: 'application/octet-stream', // Changed to handle all file types
            });

            await this.s3Client.send(command);
            return `${process.env.AWS_S3_URL}/${key}`;
        } catch (error) {
            console.error('❌ Error in S3 upload:', error);
            throw new Error(`Failed to upload to S3: ${error.message}`);
        }
    }

    async saveToLocal(stream, filename, folder) {
        const uploadsDir = path.join(__dirname, '../public/uploads', folder);

        try {
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filePath = path.join(uploadsDir, filename);
            const writeStream = fs.createWriteStream(filePath);

            await finished(stream.pipe(writeStream));
            console.log('✅ File saved successfully:', filePath);
            return `/uploads/${folder}/${filename}`;
        } catch (error) {
            console.error('❌ Error saving file locally:', error);
            throw new Error(`Failed to save file locally: ${error.message}`);
        }
    }
}

export const storageService = new StorageService();