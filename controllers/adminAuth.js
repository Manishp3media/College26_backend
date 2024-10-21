import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { adminValidationShema } from "../validations/auth.js";
import z from "zod";

export const adminLogin = async (req, res) => {
    try {
        // Validate input using Zod schema
        adminValidationShema.parse(req.body);
        const { email, password } = req.body;

        // Check if email and password are present
        if (!email || !password) {
            return res.status(400).send('Email and password are required');
        }

        // Find admin user by email
        const admin = await User.findOne({ email, role: 'admin' });

        if (!admin) {
            return res.status(400).send('Invalid credentials');
        }

        // Check if admin has a valid password
        if (!admin.password) {
            return res.status(500).send('Admin password is missing or invalid');
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET);

        res.send({ token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};


export const createAdmin = async (req, res) => {
    try {
        // Validate input
        adminValidationShema.parse(req.body);
        const { email, password } = req.body;

        // Check if an admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin account already exists' });
        }

        // Hashing and Salting the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new admin
        const admin = new User({ email, password: hashedPassword, role: 'admin' });

        // Save the admin
        await admin.save();
        res.status(201).json('Admin created successfully');
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};