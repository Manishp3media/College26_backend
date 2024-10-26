import z from 'zod';
import UniversitySubCourse from '../models/UniversitySubCourse.js';
import { CACHE_KEYS, CACHE_TTL } from '../constants/cache.js';
import mongoose from "mongoose";

// Helper function to get cached data with fallback to DB

const getCachedData = async (redisClient, key, fetchFn, ttl) => {

    const cachedData = await redisClient.get(key);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const data = await fetchFn();
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    return data;
};

// Add university sub course
export const addUniversitySubCourse = async (req, res) => {
    try {
        const redisClient = req.redisClient;

        const { universityId, subCourseId, customFees, customDescription } = req.body;

        const universitySubCourse = new UniversitySubCourse({
            university: universityId,
            subCourse: subCourseId,
            customFees,
            customDescription
        });

        const savedUniversitySubCourse = await universitySubCourse.save();

        // Invalidate related caches
        await Promise.all([
            redisClient.del(CACHE_KEYS.UNIVERSITY_SUB_COURSES.ALL),
            redisClient.del(CACHE_KEYS.UNIVERSITY_SUB_COURSES.BY_ID(savedUniversitySubCourse._id)), ,
            redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL),
            redisClient.del(CACHE_KEYS.SUB_COURSES.ALL)
        ]);

        res.status(201).json({ message: 'University sub course added successfully', savedUniversitySubCourse });
    } catch (error) {
        console.error('Error adding university sub course:', error);
        res.status(500).json({ error: 'Failed to add university sub course' });
    }
};

// Get all university sub courses
export const getAllUniversitySubCourses = async (req, res) => {
    try {
        const redisClient = req.redisClient;
        const cacheKey = CACHE_KEYS.UNIVERSITY_SUB_COURSES.ALL;

        const fetchFromDB = async () => {
            const aggregationPipeline = [
                {
                    $lookup: {
                        from: 'universities',
                        localField: 'university',
                        foreignField: '_id',
                        as: 'university'
                    }
                },
                {
                    $unwind: { path: '$university', preserveNullAndEmptyArrays: true }
                },
                {
                    $lookup: {
                        from: 'subcourses',
                        localField: 'subCourse',
                        foreignField: '_id',
                        as: 'baseSubCourse'
                    }
                },
                {
                    $unwind: { path: '$baseSubCourse', preserveNullAndEmptyArrays: true }
                },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'baseSubCourse.course',
                        foreignField: '_id',
                        as: 'courseDetails'
                    }
                },
                {
                    $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true }
                },
                {
                    $addFields: {
                        fees: { $ifNull: ['$customFees', '$baseSubCourse.fees'] },
                        description: { $ifNull: ['$customDescription', '$baseSubCourse.description'] },
                        syllabus: { $ifNull: ['$customSyllabus', '$baseSubCourse.syllabus'] },
                        banners: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ['$customBanners', []] } }, 0] },
                                then: '$customBanners',
                                else: '$baseSubCourse.banners'
                            }
                        },
                        subCourseName: '$baseSubCourse.subCourseName',
                        subCourseShortName: '$baseSubCourse.subCourseShortName',
                        courseName: '$courseDetails.courseName' 
                    }
                },
                {
                    $project: {
                        _id: 1,
                        university: {
                            _id: 1,
                            universityName: 1,
                            universityShortName: 1
                        },
                        baseSubCourse: {
                            _id: 1,
                            name: 1,
                            code: 1,
                            duration: 1,
                            eligibility: 1,
                            coursetype: 1
                        },
                        fees: 1,
                        description: 1,
                        syllabus: 1,
                        banners: 1,
                        subCourseName: 1,
                        subCourseShortName: 1,
                        courseDetails: 1
                    }
                }
            ];

            return await UniversitySubCourse.aggregate(aggregationPipeline);
        };

        const universitySubCourses = await getCachedData(redisClient, cacheKey, fetchFromDB, CACHE_TTL.MEDIUM);
        res.status(200).json(universitySubCourses);
    } catch (err) {
        console.error("Error fetching university sub courses:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getUniversitySubCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const aggregationPipeline = [
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: 'universities',
                    localField: 'university',
                    foreignField: '_id',
                    as: 'university'
                }
            },
            {
                $unwind: { path: '$university', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'subcourses',
                    localField: 'subCourse',
                    foreignField: '_id',
                    as: 'baseSubCourse'
                }
            },
            {
                $unwind: { path: '$baseSubCourse', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'baseSubCourse.course',
                    foreignField: '_id',
                    as: 'courseDetails'
                }
            },
            {
                $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true }
            },
            {
                $addFields: {
                    fees: { $ifNull: ['$customFees', '$baseSubCourse.fees'] },
                    description: { $ifNull: ['$customDescription', '$baseSubCourse.description'] },
                    syllabus: { $ifNull: ['$customSyllabus', '$baseSubCourse.syllabus'] },
                    banners: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$customBanners', []] } }, 0] },
                            then: '$customBanners',
                            else: '$baseSubCourse.banners'
                        }
                    },
                    subCourseName: '$baseSubCourse.subCourseName',
                    subCourseShortName: '$baseSubCourse.subCourseShortName',
                    courseName: '$courseDetails.courseName' 
                }
            },
            {
                $project: {
                    _id: 1,
                    university: {
                        _id: 1,
                        universityName: 1,
                        universityShortName: 1
                    },
                    baseSubCourse: {
                        _id: 1,
                        name: 1,
                        code: 1,
                        duration: 1,
                        eligibility: 1,
                        coursetype: 1
                    },
                    fees: 1,
                    description: 1,
                    syllabus: 1,
                    banners: 1,
                    subCourseName: 1,
                    subCourseShortName: 1,
                    courseDetails: 1
                }
            }
        ];

        const result = await UniversitySubCourse.aggregate(aggregationPipeline);

        if (!result.length) {
            return res.status(404).json({ error: "SubCourse not found" });
        }

        return res.status(200).json(result[0]);
    } catch (err) {
        console.error("Error fetching sub-course by ID:", err);
        return res.status(500).json({
            error: err.message,
            location: 'Check server logs for detailed error location'
        });
    }
};


// Update university sub course
export const updateUniversitySubCourse = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const redisClient = req.redisClient;

        const universitySubCourse = await UniversitySubCourse.findById(id);
        if (!universitySubCourse) {
            return res.status(404).json({ message: "University sub course not found" });
        }

        // Update only the fields that are provided
        if (req.body.customFees !== undefined) universitySubCourse.customFees = req.body.customFees;
        if (req.body.customDescription !== undefined) universitySubCourse.customDescription = req.body.customDescription;
        if (req.body.customSyllabus !== undefined) universitySubCourse.customSyllabus = req.body.customSyllabus;
        if (req.body.customBanners !== undefined) universitySubCourse.customBanners = req.body.customBanners;

        await universitySubCourse.save({ session });

        // Invalidate related caches
        await Promise.all([
            redisClient.del(CACHE_KEYS.UNIVERSITY_SUB_COURSES.ALL),
            redisClient.del(CACHE_KEYS.UNIVERSITY_SUB_COURSES.BY_ID(id)), ,
            redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL),
            redisClient.del(CACHE_KEYS.SUB_COURSES.ALL)
        ]);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: "University sub course updated successfully",
            universitySubCourse
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        console.error(err, "Error updating university sub course");
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};

// Delete university sub course
export const deleteUniversitySubCourse = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const redisClient = req.redisClient;

        const universitySubCourse = await UniversitySubCourse.findById(id);
        if (!universitySubCourse) {
            return res.status(404).json({ message: "University sub course not found" });
        }

        await UniversitySubCourse.findByIdAndDelete(id, { session });

        // Invalidate related caches
        await Promise.all([
            redisClient.del(CACHE_KEYS.UNIVERSITY_SUB_COURSES.ALL),
            redisClient.del(CACHE_KEYS.UNIVERSITY_SUB_COURSES.BY_ID(id)), ,
            redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL),
            redisClient.del(CACHE_KEYS.SUB_COURSES.ALL)
        ]);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: "University sub course deleted successfully", id
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        console.error(err, "Error deleting university sub course");
        res.status(500).json({ error: err.message });
    }
};