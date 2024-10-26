import Accrediation from "../models/Accrediation.js";
import z from "zod";
import { CACHE_KEYS, CACHE_TTL } from "../constants/cache.js";
import { accrediationValidationShema } from "../validations/accrediation.js";

// Add Accrediation
export const addAccrediation = async (req, res) => {
    try {
        const redisClient = req.redisClient;
        // Validate input
        accrediationValidationShema.parse(req.body);

        const { name }  = req.body;
        const lowerCaseName = name.toLowerCase();

        // Check if the name already exists
        const existingAccrediation = await Accrediation.findOne({ name: lowerCaseName });
        if (existingAccrediation) {
            return res.status(400).json({ error: 'Accrediation already exists' });
        }

        // Create new Accrediation
        const newAccrediation = new Accrediation({ name: lowerCaseName });
        await newAccrediation.save();

        // Invalidate the streams cache
        await redisClient.del(CACHE_KEYS.ACCREDITATION.ALL);
        res.status(201).json({ message: 'Accrediation added successfully', newAccrediation });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};

// Get Accrediation
export const getAccrediation = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        const cachedAccrediation = await redisClient.get(CACHE_KEYS.ACCREDITATION.ALL);
        if (cachedAccrediation) {
            return res.status(200).json(JSON.parse(cachedAccrediation));
        }

        // Get Accrediation
        const accrediation = await Accrediation.find();

        await redisClient.setEx(
            CACHE_KEYS.ACCREDITATION.ALL, 
            CACHE_TTL.MEDIUM, 
            JSON.stringify(accrediation));
       
        res.status(200).json(accrediation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}