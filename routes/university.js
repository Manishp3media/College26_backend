import express from "express";
import { addUniversity, getAllUniversities, editUniversity, deleteUniversity } from "../controllers/university.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Add University
router.post("/add/university", authMiddleware("admin"), addUniversity);

// Get Universities
router.get("/get/universities", authMiddleware("admin"), getAllUniversities);

// Edit University
router.patch("/edit/university", authMiddleware("admin"), editUniversity);

// Delete University
router.delete("/delete/university", authMiddleware("admin"), deleteUniversity);


export default router;