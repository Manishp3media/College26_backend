import z from "zod";
import Amenity from "../models/Amenity.js";
import { addAmenityValidationShema } from "../validations/amenity.js";

// Add Amenity
export const addAmenity = async (req, res) => {
    try {
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
        const amenity = await Amenity.find();
        res.status(200).json(amenity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}