import AcademicLevel from "../models/AcademicLevel.js";
import {addAcademicLevelValidationShema} from "../validations/AcademicLevel.js";
import z from "zod";
import { CACHE_KEYS, CACHE_TTL } from "../constants/constants.js";

// ADD ACADEMIC LEVEL
export const addAcademicLevel = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Validate input
        addAcademicLevelValidationShema.parse(req.body);
        const { name, streams } = req.body;
        const lowerCaseName = name.toLowerCase();

        // Check if the name already exists
        const existingAcademicLevel = await AcademicLevel.findOne({ name: lowerCaseName });
        if (existingAcademicLevel) {
            return res.status(400).json({ error: "Academic level already exists" });
        }

        // Create new Academic Level
        const newAcademicLevel = new AcademicLevel({ name: lowerCaseName, streams });
        await newAcademicLevel.save();

        // Invalidate the streams cache
        await redisClient.del(CACHE_KEYS.ACADEMIC_LEVEL.ALL);
        res.status(201).json({ message: "Academic level added successfully", newAcademicLevel });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
}

// get academic level
export const getAcademicLevel = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Use the constant cache key
        const cachedAcademicLevel = await redisClient.get(CACHE_KEYS.ACADEMIC_LEVEL.ALL);

        if (cachedAcademicLevel) {
            return res.status(200).json(JSON.parse(cachedAcademicLevel));
        }

        const academicLevel = await AcademicLevel.find();

        // Use the constant TTL
        await redisClient.setEx(
            CACHE_KEYS.ACADEMIC_LEVEL.ALL,
            CACHE_TTL.LONG, // 1 hour cache
            JSON.stringify(academicLevel)
        );

        res.status(200).json(academicLevel);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}