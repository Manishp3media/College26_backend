import SubCourse from "../models/SubCourse.js";
import z from "zod";
import {addSubCourseValidationShema} from "../validations/subCourse.js";
import { CACHE_KEYS, CACHE_TTL } from "../constants/cache.js";

// Add Sub-course
export const addSubCourse = async (req, res) => {
    const redisClient = req.redisClient;

    try {
        // Validate input using Zod schema
        addSubCourseValidationShema.parse(req.body);
        const { subCourseName, subCourseShortName, subCourseDescription, fees, course } = req.body;

        // Convert name to lowercase
        const lowerCaseSubCourseName = subCourseName.toLowerCase();
        const lowerCaseSubCourseShortName = subCourseShortName.toLowerCase();

        // Check if sub-course already exists
        const existingSubCourse = await SubCourse.findOne({ $or: [{ subCourseName: lowerCaseSubCourseName }, { subCourseShortName: lowerCaseSubCourseShortName }] });

        if (existingSubCourse) {
            return res.status(409).json({ message: "Sub-course already exists" });
        }

        // Create new sub-course
        const subCourse = new SubCourse({
            subCourseName: lowerCaseSubCourseName,
            subCourseShortName: lowerCaseSubCourseShortName,
            subCourseDescription,
            fees,
            course
        });

         // Invalidate the sub-course cache
         await redisClient.del(CACHE_KEYS.SUB_COURSES.ALL);

        // Save sub-course to database
        await subCourse.save();
        res.status(201).json({ message: "Sub-course created successfully", subCourse });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });   
    }
}

// Get Sub-course
export const getSubCourse = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        // Use the constant cache key
        const cachedSubCourse = await redisClient.get(CACHE_KEYS.SUB_COURSES.ALL);
        if (cachedSubCourse) {
            return res.status(200).json(JSON.parse(cachedSubCourse));
        }

        const subCourse = await SubCourse.find();

        // Use the constant TTL
        await redisClient.setEx(
            CACHE_KEYS.SUB_COURSES.ALL,
            CACHE_TTL.LONG, // 1 hour cache
            JSON.stringify(subCourse)
        );
        res.status(200).json(subCourse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Edit Sub-course
export const editSubCourse = async (req, res) => {
    const redisClient = req.redisClient;
    try {
        // Validate input using Zod schema
        addSubCourseValidationShema.parse(req.body);
        const { id, subCourseName, subCourseShortName, subCourseDescription, fees, course } = req.body;

        // Check if sub-course exists
        const subCourse = await SubCourse.findById(id);
        if (!subCourse) {
            return res.status(404).json({ message: "Sub-course not found" });
        }

         // Prepare an update object, including only fields that are provided in the body
         const updateFields = {};
         if (subCourseName) updateFields.subCourseName = subCourseName.toLowerCase();
         if (subCourseShortName) updateFields.subCourseShortName = subCourseShortName.toLowerCase();
         if (subCourseDescription) updateFields.subCourseDescription = subCourseDescription;
         if (fees) updateFields.fees = fees;
         if (course) updateFields.course = course;  

        // Check if sub-course already exists
        const existingSubCourse = await SubCourse.findOne({ $or: [{ subCourseName: subCourseName }, { subCourseShortName: subCourseShortName }], _id: { $ne: id } });

        // if sub-course already exists return error
        if (existingSubCourse) {
            return res.status(409).json({ message: "Sub-course already exists" });
        }

        // Update sub-course
        const updatedSubCourse = await SubCourse.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

         // Invalidate the sub-course cache
         await redisClient.del(CACHE_KEYS.SUB_COURSES.ALL);
        
        res.status(201).json({ message: "Sub-course edited successfully", subCourse: updatedSubCourse });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });   
    }
}

// Delete Sub-course
export const deleteSubCourse = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        const { id } = req.body;

        // Delete the sub-course from the database
        const deletedSubCourse = await SubCourse.findByIdAndDelete(id);

        // sub-course not found
        if (!deletedSubCourse) {
            return res.status(404).json({ message: "Sub-course not found" });
        }

        // Invalidate the sub-course cache
        await redisClient.del(CACHE_KEYS.SUB_COURSES.ALL);

        res.status(200).json({ message: "Sub-course deleted successfully", id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}