import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userAuthRoutes from "./routes/userAuth.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import accrediationRoutes from "./routes/accrediation.js";
import amenityRoutes from "./routes/amenity.js";
import placementPartnerRoutes from "./routes/placementPartner.js";
import socialMediaRoutes from "./routes/socialMedia.js";
import streamRoutes from "./routes/stream.js";

// Load environment variables from .env file
dotenv.config(); // Load environment variables from .env file

const app = express();

// CORS configuration to allow all origins
app.use(cors({
  origin: "*", // Allow all origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  credentials: true
}));

// Middleware to parse JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api", userAuthRoutes);
app.use("/api", adminAuthRoutes);
app.use("/api", accrediationRoutes);
app.use("/api", amenityRoutes);
app.use("/api", placementPartnerRoutes);
app.use("/api", socialMediaRoutes);
app.use("/api", streamRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Hello World from backend"});
})

// Database connection
mongoose
    .connect(process.env.MONGO_URL, {
}).then(() => {
    console.log("MongoDB connected successfully");
}).catch((error) => console.log(`${error} did not connect`));



// Server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
