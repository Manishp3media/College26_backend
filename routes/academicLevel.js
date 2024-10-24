import { addAcademicLevel, getAcademicLevel } from "../controllers/AcademicLevel.js";
import express from "express";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Add Academic Level
router.post("/add/academiclevel", authMiddleware("admin"), addAcademicLevel);

// Get Academic Level
router.get("/get/academiclevels", authMiddleware("admin"), getAcademicLevel);

export default router;