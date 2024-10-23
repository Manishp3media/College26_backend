import Stream from "../models/Stream.js";
import { addStreamValidationShema } from "../validations/stream.js";

// Add Stream
export const addStream = async (req, res) => {
    try {
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
        const streams = await Stream.find();
        res.status(200).json(streams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}