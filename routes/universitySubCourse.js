import express from "express";
import { addUniversitySubCourse, getAllUniversitySubCourses,  updateUniversitySubCourse, deleteUniversitySubCourse, getUniversitySubCourseById } from "../controllers/univesitySubCourse.js";
import authMiddleware from "../middlewares/auth.js"

const router = express.Router();

// Add University Sub-Course
router.post("/add/university/subcourse", authMiddleware("admin"), addUniversitySubCourse);

// Get All University Sub-Courses
router.get("/get/university/subcourses", authMiddleware("admin"), getAllUniversitySubCourses);

// Get University Sub-Course by ID
router.get("/get/university/subcourse/:id", getUniversitySubCourseById);

//Update University Sub-Course
router.patch("/update/university/subcourse/:id", updateUniversitySubCourse);

// Delete University Sub-Course
router.delete("/delete/university/subcourse/:id", deleteUniversitySubCourse);

export default router;