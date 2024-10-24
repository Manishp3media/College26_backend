import { addCourse, deleteCourse, editCourse, getCourse } from "../controllers/course.js";
import express from "express";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Add Course
router.post("/add/course", authMiddleware("admin"), addCourse);

// Get Course
router.get("/get/courses", authMiddleware("admin"), getCourse);

// Edit Course
router.patch("/edit/course", authMiddleware("admin"), editCourse);

// Delete Course
router.delete("/delete/course", authMiddleware("admin"), deleteCourse);

export default router;