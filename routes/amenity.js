import { addAmenity, getAmenity } from "../controllers/amenity.js";
import express from "express";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// add accrediation
router.post("/add/amenity", authMiddleware("admin"), addAmenity);

// get amenity
router.get("/get/amenities", authMiddleware("admin"), getAmenity);

export default router;