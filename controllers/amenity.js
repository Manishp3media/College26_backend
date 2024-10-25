import z from "zod";
import Amenity from "../models/Amenity.js";
import { addAmenityValidationShema } from "../validations/amenity.js";
import { CACHE_KEYS, CACHE_TTL } from "../constants/cache.js";

// Add Amenity
export const addAmenity = async (req, res) => {
    try {
        const redisClient = req.redisClient;
        // Validate input
        addAmenityValidationShema.parse(req.body);

        const { name, iconName } = req.body;

        const lowerCaseName = name.toLowerCase();

        // Check if the name already exists
        const existingAmenity = await Amenity.findOne({ name: lowerCaseName });
        if (existingAmenity) {
            return res.status(400).json({ error: "Amenity already exists" });
        }
        
        const newAmenity = new Amenity({ name: lowerCaseName, iconName });
        await newAmenity.save();

        // Invalidate the cache
        await redisClient.del(CACHE_KEYS.AMENITY.ALL);
        res.status(201).json({ message: "Amenity added successfully", newAmenity });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};

// Get Amenity
export const getAmenity = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Use the constant cache key
        const cachedAmenity = await redisClient.get(CACHE_KEYS.AMENITY.ALL);
        if (cachedAmenity) {
            return res.status(200).json(JSON.parse(cachedAmenity));
        }

        // Get Amenity
        const amenity = await Amenity.find();

        // Use the constant TTL
        await redisClient.setEx(
            CACHE_KEYS.AMENITY.ALL,
            CACHE_TTL.LONG, // 1 hour cache
            JSON.stringify(amenity)
        );
        
        res.status(200).json(amenity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}