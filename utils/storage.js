// src/services/storageService.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from "dotenv";

dotenv.config();

class StorageService {
    constructor() {
        // Initialize Cloudinary for development
        if (process.env.NODE_ENV === 'development') {
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });
        }
        
        // Initialize S3 for production
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

            if (process.env.NODE_ENV === 'development') {
                return await this.saveToCloudinary(stream, file.filename, folder);
            } else {
                return await this.saveToS3(stream, file.filename, folder);
            }
        } catch (error) {
            console.error('❌ Error in saveImage:', error);
            throw new Error(`Failed to save image: ${error.message}`);
        }
    }

    async saveToCloudinary(stream, filename, folder) {
        try {
            // Use OS temp directory instead of hardcoded path
            const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
            const writeStream = fs.createWriteStream(tempFilePath);
            
            try {
                await finished(stream.pipe(writeStream));
                
                // Upload to Cloudinary
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload(
                        tempFilePath,
                        {
                            folder: folder,
                            resource_type: 'auto'
                        },
                        (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                });

                console.log('✅ File uploaded to Cloudinary:', result.secure_url);
                return result.secure_url;

            } catch (error) {
                throw error;
            } finally {
                // Clean up temp file in finally block to ensure it runs
                try {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                        console.log('✅ Temporary file cleaned up');
                    }
                } catch (cleanupError) {
                    console.error('Warning: Failed to clean up temp file:', cleanupError);
                }
            }

        } catch (error) {
            console.error('❌ Error in Cloudinary upload:', error);
            throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
        }
    }

    async saveToS3(stream, filename, folder) {
        try {
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);
            const key = `${folder}/${Date.now()}-${filename}`;

            const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: 'application/octet-stream',
            });

            await this.s3Client.send(command);
            const fileUrl = `${process.env.AWS_S3_URL}/${key}`;
            console.log('✅ File uploaded to S3:', fileUrl);
            return fileUrl;
        } catch (error) {
            console.error('❌ Error in S3 upload:', error);
            throw new Error(`Failed to upload to S3: ${error.message}`);
        }
    }
}

export const storageService = new StorageService();