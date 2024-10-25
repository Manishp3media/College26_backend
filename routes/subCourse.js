import express from "express";
import authMiddleware from "../middlewares/auth.js";
import { addSubCourse, getSubCourse, editSubCourse, deleteSubCourse } from "../controllers/subCourse.js";

const router = express.Router();

// Add Sub-course
router.post("/add/subcourse", authMiddleware("admin"), addSubCourse);

// Get Sub-course
router.get("/get/subcourses", authMiddleware("admin"), getSubCourse);

// Edit Sub-course
router.patch("/edit/subcourse", authMiddleware("admin"), editSubCourse);

// Delete Sub-course
router.delete("/delete/subcourse", authMiddleware("admin"), deleteSubCourse);

export default router;