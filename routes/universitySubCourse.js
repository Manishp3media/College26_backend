import express from "express";
import SubCourse from "../models/SubCourse.js";
import { getAllUniversitySubCourses, getUniversitySubCourseById, updateUniversitySubCourse, deleteUniversitySubCourse } from "../controllers/univesitySubCourse.js";

const router = express.Router();

// Get All University Sub-Courses
router.get("/get/university/subcourses", getAllUniversitySubCourses);

// Get University Sub-Course by ID
router.get("/get/university/subcourse/:id", getUniversitySubCourseById);

// Update University Sub-Course
router.patch("/update/university/subcourse/:id", updateUniversitySubCourse);

// Delete University Sub-Course
router.delete("/delete/university/subcourse/:id", deleteUniversitySubCourse);