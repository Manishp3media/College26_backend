import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from "redis";
import { redisMiddleware } from "./middlewares/redis.js";
import userAuthRoutes from "./routes/userAuth.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import accrediationRoutes from "./routes/accrediation.js";
import amenityRoutes from "./routes/amenity.js";
import placementPartnerRoutes from "./routes/placementPartner.js";
import socialMediaRoutes from "./routes/socialMedia.js";
import streamRoutes from "./routes/stream.js";
import academicLevelRoutes from "./routes/academicLevel.js";
import courseRoutes from "./routes/course.js";

// Load environment variables from .env file
dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware to parse JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS configuration to allow all origins
app.use(cors({
    origin: "*", // Allow all origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true
}));

// Initialize Redis client with async/await
async function connectRedis() {
    const redisClient = createClient();

    redisClient.on('error', (err) => console.log('Redis Client Error:', err));

    try {
        await redisClient.connect(); // Connect to Redis
        console.log('Redis connected successfully'); // Log successful connection
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }

    return redisClient;
}

// Connect to Redis and use middleware
connectRedis()
    .then(redisClient => {
        app.use(redisMiddleware(redisClient)); // Use the Redis middleware

        // Define your routes here
        app.use("/api", userAuthRoutes);
        app.use("/api", adminAuthRoutes);
        app.use("/api", accrediationRoutes);
        app.use("/api", amenityRoutes);
        app.use("/api", placementPartnerRoutes);
        app.use("/api", socialMediaRoutes);
        app.use("/api", streamRoutes);
        app.use("/api", academicLevelRoutes);
        app.use("/api", courseRoutes);

        // Test route
        app.get("/", (req, res) => {
            res.json({ message: "Hello World from backend" });
        });

        // Database connection
        mongoose
            .connect(process.env.MONGO_URL, {})
            .then(() => {
                console.log("MongoDB connected successfully");
                // Server listening should be inside this block
                const PORT = process.env.PORT || 5000;
                app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
            })
            .catch((error) => console.log(`${error} did not connect`));
    })
    .catch((err) => {
        console.error('Failed to initialize Redis middleware:', err);
    });


// // Server listening
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
