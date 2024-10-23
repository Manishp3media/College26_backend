import SocialMedia from "../models/SocialMedia.js";
import { addSocialMediaValidationShema } from "../validations/socialMedia.js";
import z from "zod";

// Add Social Media Links
export const addSocialMedia = async (req, res) => {
    try {
        // Validate input
        addSocialMediaValidationShema.parse(req.body);
        const { name, url } = req.body;
        const lowerCaseName = name.toLowerCase();   

        // Check if the name already exists
        const existingSocialMedia = await SocialMedia.findOne({ name: lowerCaseName });
        if (existingSocialMedia) {
            return res.status(400).json({ error: "Social media already exists" });
        }

        // Create new Social Media
        const newSocialMedia = new SocialMedia({ name: lowerCaseName, url });
        await newSocialMedia.save();
        res.status(201).json({ message: "Social media added successfully", newSocialMedia });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};

// Get Social Media Links
export const getSocialMedia = async (req, res) => {
    try {
        const socialMedia = await SocialMedia.find();
        res.status(200).json(socialMedia);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}