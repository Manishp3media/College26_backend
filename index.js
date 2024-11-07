import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { createClient } from "redis";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { GraphQLUpload, graphqlUploadExpress } from 'graphql-upload-minimal'; 
import bodyParser from 'body-parser';  
import { typeDefs, resolvers } from './graphql/schema.js';
import { createContext } from './graphql/context.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();

// Serve the uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


// Initialize Redis client
async function initializeRedisClient() {
    const redisClient = createClient();
    
    try {
        await redisClient.connect();
        console.log('Redis connected successfully');
        return redisClient;
    } catch (err) {
        throw err;
    }
}

// Main server initialization
async function initializeApolloServer() {
    
    try {
        // Initialize Redis
        const redisClient = await initializeRedisClient();

        // Create Apollo Server
       
        const server = new ApolloServer({
            typeDefs,
            resolvers: {
                Upload: GraphQLUpload, // Add Upload scalar
                ...resolvers
            },
            formatError: (error) => {
                console.error('GraphQL Error:', {
                    message: error.message,
                    locations: error.locations,
                    path: error.path,
                    extensions: error.extensions
                });
                return error;
            },
            csrfPrevention: false,
        });

        await server.start();

        app.use(cors());
        app.use(express.json());


        // 3. URL Encoded Parser
        app.use(bodyParser.urlencoded({ extended: true }));
        // 4. Upload middleware
        app.use(graphqlUploadExpress({ 
            maxFileSize: 50000000, // 50 MB
            maxFiles: 50
        }));


        // // Upload request logging middleware
        // app.use('/graphql', (req, res, next) => {
        //     if (req.body && req.body.operations) {
        //         console.log('\n📦 Upload Request Details:');
        //         console.log('Operations:', req.body.operations);
        //         console.log('Map:', req.body.map);
        //         console.log('Files:', req.files || 'No files');
        //     }
        //     next();
        // });

        // 5. Apollo Server Middleware
        app.use(
            '/graphql',
            expressMiddleware(server, {
                context: async ({ req }) => {
                    return createContext({ req, redisClient });
                },
            })
        );
      
        try {
            await mongoose.connect(process.env.MONGO_URL);
            console.log('✅ MongoDB connected successfully');

            // Start server
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log(`\n🚀 Server is running!`);
                console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            });

        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }

    } catch (error) {
        console.error('❌ Server initialization failed:', error);
        process.exit(1);
    }
}

// Start the server
initializeApolloServer();