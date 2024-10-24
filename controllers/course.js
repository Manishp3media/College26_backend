import Course from "../models/Course.js";
import z from "zod";
import { addCourseValidationShema } from "../validations/course.js";
import { CACHE_KEYS, CACHE_TTL } from "../constants/constants.js";

// add course
export const addCourse = async (req, res) => {
    try {
        const redisClient = req.redisClient;
        // Validate input using Zod schema
        addCourseValidationShema.parse(req.body);

        const { courseName, courseShortName, duration, admissionOpen, digitalLearningSupport, courseType, academicLevel  } = req.body;

        // Convert name to lowercase
        const lowerCaseCourseName = courseName.toLowerCase();
        const lowerCaseCourseShortName = courseShortName.toLowerCase();

        // Check if course already exists
        const existingCourse = await Course.findOne({ $or: [{ courseName: lowerCaseCourseName }, { courseShortName: lowerCaseCourseShortName }] });
        if (existingCourse) {
            return res.status(409).json({ message: "Course already exists" });
        }

        const course = new Course({
            courseName: lowerCaseCourseName,
            courseShortName: lowerCaseCourseShortName,
            duration,
            admissionOpen,
            digitalLearningSupport,
            courseType,
            academicLevel
        });

        // Save course to database
        await course.save();

        // Invalidate the course cache
        await redisClient.del(CACHE_KEYS.COURSES.ALL);
        res.status(201).json({ message: "Course added successfully", course });
    } catch (err) {
        console.error(err);
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.issues[0].message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}

// get course
export const getCourse = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Use the constant cache key
        const cachedCourse = await redisClient.get(CACHE_KEYS.COURSES.ALL);
        if (cachedCourse) {
            return res.status(200).json(JSON.parse(cachedCourse));
        }

        // Get courses from database
        const courses = await Course.find();

        // Use the constant TTL
        await redisClient.setEx(
            CACHE_KEYS.COURSES.ALL,
            CACHE_TTL.LONG, // 1 hour cache
            JSON.stringify(courses)
        );

        res.status(200).json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

// edit course
export const editCourse = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Destructure the fields from the body, leaving out undefined fields
        const {
            id,
            courseName,
            courseShortName,
            duration,
            admissionOpen,
            digitalLearningSupport,
            courseType,
            academicLevel
        } = req.body;

        // Prepare an update object, including only fields that are provided in the body
        const updateFields = {};
        if (courseName) updateFields.courseName = courseName.toLowerCase();
        if (courseShortName) updateFields.courseShortName = courseShortName.toLowerCase();
        if (duration) updateFields.duration = duration;
        if (admissionOpen !== undefined) updateFields.admissionOpen = admissionOpen;
        if (digitalLearningSupport !== undefined) updateFields.digitalLearningSupport = digitalLearningSupport;
        if (courseType) updateFields.courseType = courseType;
        if (academicLevel) updateFields.academicLevel = academicLevel;

        // Check if a course with the same name or short name (ignoring the current course) already exists
        const courseExists = await Course.findOne({
            $or: [
                { courseName: updateFields.courseName },
                { courseShortName: updateFields.courseShortName }
            ],
            _id: { $ne: id }  // Exclude the course with the current ID
        });
        if (courseExists) {
            return res.status(409).json({ message: "Course with this name or short name already exists" });
        }

        // Update the course in the database
        const updatedCourse = await Course.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Invalidate the course cache
        await redisClient.del(CACHE_KEYS.COURSES.ALL);

        res.status(200).json({ message: "Course updated successfully", updatedCourse });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

// delete course
export const deleteCourse = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Extract course ID from params
        const { id  } = req.body;

        // Delete the course from the database
        const deletedCourse = await Course.findByIdAndDelete(id);

        // course not found
        if (!deletedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Invalidate the course cache
        await redisClient.del(CACHE_KEYS.COURSES.ALL);

        res.status(200).json({ message: "Course deleted successfully", deletedCourse });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}