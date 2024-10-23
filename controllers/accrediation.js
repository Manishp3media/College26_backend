import Accrediation from "../models/Accrediation.js";
import z from "zod";

import { accrediationValidationShema } from "../validations/accrediation.js";

// Add Accrediation
export const addAccrediation = async (req, res) => {
    try {
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
        const accrediation = await Accrediation.find();
        res.status(200).json(accrediation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}