import Stream from "../models/Stream.js";
import { addStreamValidationShema } from "../validations/stream.js";
import z from "zod";
import { CACHE_KEYS, CACHE_TTL } from "../constants/constants.js";

// Add Stream
export const addStream = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Validate input using Zod schema
        addStreamValidationShema.parse(req.body);
        const { name } = req.body;

        // Convert name to lowercase
        const lowerCaseName = name.toLowerCase();

        // Check if the name already exists
        const existingStream = await Stream.findOne({ name: lowerCaseName });
        if (existingStream) {
            return res.status(400).json({ error: "Stream already exists" });
        }

        // Create new Stream
        const newStream = new Stream({ name: lowerCaseName });
        await newStream.save();

        // Invalidate the streams cache
        await redisClient.del(CACHE_KEYS.STREAMS.ALL);

        res.status(201).json({ message: "Stream added successfully", newStream });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
}

// Get Streams 
export const getStreams = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Use the constant cache key
        const cachedStreams = await redisClient.get(CACHE_KEYS.STREAMS.ALL);
        
        if (cachedStreams) {
            return res.status(200).json(JSON.parse(cachedStreams));
        }

        const streams = await Stream.find();

        // Use the constant TTL
        await redisClient.setEx(
            CACHE_KEYS.STREAMS.ALL,
            CACHE_TTL.LONG, // 1 hour cache
            JSON.stringify(streams)
        );

        res.status(200).json(streams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// // Get Stream by ID (example of using individual cache keys)
// export const getStreamById = async (req, res) => {
//     try {
//         const redisClient = req.redisClient;
//         const { id } = req.params;

//         // Try to get from cache first
//         const cachedStream = await redisClient.get(CACHE_KEYS.STREAMS.BY_ID(id));

//         if (cachedStream) {
//             return res.status(200).json(JSON.parse(cachedStream));
//         }

//         const stream = await Stream.findById(id);
        
//         if (!stream) {
//             return res.status(404).json({ error: "Stream not found" });
//         }

//         // Cache the individual stream
//         await redisClient.setEx(
//             CACHE_KEYS.STREAMS.BY_ID(id),
//             CACHE_TTL.LONG, // 1 hour cache for individual streams
//             JSON.stringify(stream)
//         );

//         res.status(200).json(stream);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };