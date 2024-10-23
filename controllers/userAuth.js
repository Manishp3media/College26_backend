import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { userSignupShema, userSigninShema } from "../validations/auth.js";
import z from "zod";

// Signup Controller
export const userSignup = async (req, res) => {
    try {
        // Validate Input
        userSignupShema.parse(req.body);

        const { fullName, mobileNumber, email, gender, dob, country, state, city, qualification } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ mobileNumber }, { email }], role: "user" });

        if (existingUser) {
            return res.status(403).json({ message: "User already exists" });
        }

        // Convert dob string to Date object
        const dateOfBirth = new Date(dob);


        const user = new User({
            fullName,
            mobileNumber,
            email,
            gender,
            dob: dateOfBirth,
            country,
            state,
            city,
            qualification,
            // TODO: Add sub-course
            // subCourse,
            role: "user"
        });

        await user.save();

        return res.json({ message: "User created successfully" });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};

// Signin Controller
export const userSignin = async (req, res) => {
    try {
        // Validate Input
        userSigninShema.parse(req.body);

        const { mobileNumber } = req.body;

        // Check if user exists
        const user = await User.findOne({ mobileNumber });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate jwt token
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);

        return res.json({ message: "User logged in successfully", token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};
