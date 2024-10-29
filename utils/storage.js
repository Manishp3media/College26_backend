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
        try {
            // console.log('📥 Starting file save process...');
            // console.log('📦 File object:', {
            //     filename: file.filename,
            //     mimetype: file.mimetype,
            //     encoding: file.encoding
            // });

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
            ContentType: 'image/jpeg',
        });

        await this.s3Client.send(command);
        return `${process.env.AWS_S3_URL}/${key}`;
    }

    async saveToLocal(stream, filename, folder) {
        const uploadsDir = path.join(__dirname, '../public/uploads', folder);
        
        console.log('📁 Saving to directory:', uploadsDir);
        
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, filename);
        const writeStream = fs.createWriteStream(filePath);

        return new Promise((resolve, reject) => {
            stream
                .pipe(writeStream)
                .on('finish', () => {
                    console.log('✅ File saved successfully:', filePath);
                    resolve(`/uploads/${folder}/${filename}`);
                })
                .on('error', (error) => {
                    console.error('❌ Error saving file:', error);
                    reject(error);
                });
        });
    }
}

export const storageService = new StorageService();