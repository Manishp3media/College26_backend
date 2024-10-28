import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { typeDefs, resolvers } from './graphql/schema.js'; // Import from schema.js
import { createContext } from './graphql/context.js';

dotenv.config();

const app = express();

// Initialize Redis client
async function initializeApolloServer() {
  const redisClient = createClient();
  
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error(error);
      return error;
    },
  });

  await server.start();

  // Apply middleware
  app.use(cors());
  app.use(express.json());
  
  app.use('/graphql', 
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req, redisClient })
    })
  );

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB connected successfully');
    
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

initializeApolloServer();
