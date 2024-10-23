import PlacementParnter from "../models/PlacementParnter.js";
import z from "zod";
import { addPlacementPartnerValidationShema } from "../validations/placementPartner.js";

// Add Placement Partner
export const addPlacementPartner = async (req, res) => {
    try {
        // Validate input using Zod schema
        addPlacementPartnerValidationShema.parse(req.body);
        const { name } = req.body;

        // Convert name to lowercase
        const lowerCaseName = name.toLowerCase();

        // Check if the name already exists
        const existingPlacementPartner = await PlacementParnter.findOne({ name: lowerCaseName });
        if (existingPlacementPartner) {
            return res.status(400).json({ error: "Placement partner already exists" });
        }

        // Create new PlacementPartner
        const newPlacementPartner = new PlacementParnter({ name: lowerCaseName });
        await newPlacementPartner.save();

        res.status(201).json({ message: "Placement partner added successfully", newPlacementPartner });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
}

// Get Placement Partner
export const getPlacementPartner = async (req, res) => {
    try {
        const placementPartner = await PlacementParnter.find();
        res.status(200).json(placementPartner);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}