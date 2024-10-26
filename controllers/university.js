import University from "../models/University.js";
import Accrediation from "../models/Accrediation.js";
import SocialMedia from "../models/SocialMedia.js";
import PlacementPartner from "../models/PlacementParnter.js";
import Amenity from "../models/Amenity.js";
import SubCourse from "../models/SubCourse.js";
import z from "zod";
import { addUniversityValidationSchema } from "../validations/University.js";
import { CACHE_KEYS, CACHE_TTL } from "../constants/cache.js";
import mongoose from "mongoose";
import UniversitySubCourse from "../models/UniversitySubCourse.js";

// Helper function to validate MongoDB ObjectIds
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to fetch ids from redis and validate incoming ids
const fetchAndCacheIDs = async (redisClient, key, model, ids, ttl) => {
  // First validate that all IDs are valid ObjectIds
  const invalidIds = ids.filter(id => !isValidObjectId(id));
  if (invalidIds.length > 0) {
      throw new Error(`Invalid ObjectIds found: ${invalidIds.join(', ')}`);
  }

  const cachedData = await redisClient.get(key);
  if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // Filter to only include requested IDs
      return parsed.filter(item => ids.includes(item._id.toString()));
  } else {
      const result = await model.find({ _id: { $in: ids } });
      // Filter to only include requested IDs
      const filteredResult = result.filter(item => ids.includes(item._id.toString()));
      await redisClient.setEx(key, ttl, JSON.stringify(filteredResult));
      return filteredResult;
  }
};

// Add University
export const addUniversity = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
        const redisClient = req.redisClient;
  
        // Validate request body
        addUniversityValidationSchema.parse(req.body);
        const { 
            universityName, 
            universityShortName, 
            tagLine, 
            universityLink, 
            about, 
            accrediations, 
            universitySubCourses, // This will now be an array of objects with customization data
            admissionProcess, 
            examinationPattern, 
            placementPartners, 
            socialMediaLinks, 
            amenities 
        } = req.body;
  
        // Convert name to lowercase
        const lowerCaseUniversityName = universityName.toLowerCase();
        const lowerCaseUniversityShortName = universityShortName.toLowerCase();
  
        // Check if university exists
        const existingUniversity = await University.findOne({ 
            $or: [{ universityName: lowerCaseUniversityName }, { universityShortName: lowerCaseUniversityShortName }] 
        });
        if (existingUniversity) {
            return res.status(409).json({ message: "University already exists" });
        }

        // Validate that all subcourse IDs exist
        const subCourseIds = universitySubCourses.map(course => 
            typeof course === 'string' ? course : course.subCourseId
        );
        
        const [validAccrediations, validSubCourses, validSocialMediaLinks, validPlacementPartners, validAmenities] = await Promise.all([
            fetchAndCacheIDs(redisClient, CACHE_KEYS.ACCREDITATION.ALL, Accrediation, accrediations, CACHE_TTL.MEDIUM),
            fetchAndCacheIDs(redisClient, CACHE_KEYS.SUB_COURSES.ALL, SubCourse, subCourseIds, CACHE_TTL.MEDIUM),
            fetchAndCacheIDs(redisClient, CACHE_KEYS.SOCIAL_MEDIA.ALL, SocialMedia, Array.isArray(socialMediaLinks) ? socialMediaLinks : [socialMediaLinks], CACHE_TTL.MEDIUM),
            fetchAndCacheIDs(redisClient, CACHE_KEYS.PLACEMENT_PARTNERS.ALL, PlacementPartner, placementPartners, CACHE_TTL.MEDIUM),
            fetchAndCacheIDs(redisClient, CACHE_KEYS.AMENITIES.ALL, Amenity, amenities, CACHE_TTL.MEDIUM)
        ]);
  
        // Validation checks
        if (validAccrediations.length !== accrediations.length) {
            return res.status(400).json({ message: "Invalid accreditation IDs" });
        }
        if (validSubCourses.length !== subCourseIds.length) {
            return res.status(400).json({ message: "Invalid sub-course IDs" });
        }
        if (validSocialMediaLinks.length !== socialMediaLinks.length) {
            return res.status(400).json({ message: "Invalid social media link IDs" });
        }
        if (validPlacementPartners.length !== placementPartners.length) {
            return res.status(400).json({ message: "Invalid placement partner IDs" });
        }
        if (validAmenities.length !== amenities.length) {
            return res.status(400).json({ message: "Invalid amenity IDs" });
        }
  
        // Create new University
        const newUniversity = new University({
            universityName: lowerCaseUniversityName,
            universityShortName: lowerCaseUniversityShortName,
            tagLine,
            universityLink,
            about,
            accrediations: validAccrediations,
            admissionProcess,
            examinationPattern,
            placementPartners: validPlacementPartners,
            socialMediaLinks: validSocialMediaLinks,
            amenities: validAmenities
        });
  
        await newUniversity.save({ session });
        
        // Process university sub courses with custom data
        const universitySubCoursesToSave = universitySubCourses.map(course => {
            // Handle both string (just ID) and object (with custom data) formats
            if (typeof course === 'string') {
                return {
                    university: newUniversity._id,
                    subCourse: course
                };
            }

            return {
                university: newUniversity._id,
                subCourse: course.subCourseId,
                customFees: course.customFees,
                customDescription: course.customDescription,
                // customSyllabus: course.customSyllabus,
                // customBanners: course.customBanners
            };
        });
  
        // Save all university sub courses
        await UniversitySubCourse.insertMany(universitySubCoursesToSave, { session });
  
        // Invalidate the university cache
        redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL);
  
        await session.commitTransaction();
        session.endSession();
  
        res.status(201).json({ 
            message: "University and associated sub-courses added successfully", 
            newUniversity 
        });
  
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(err, "Error adding university");
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    }
};

export const getAllUniversities = async (req, res) => {
    try {
        const redisClient = req.redisClient;
        const cacheKey = CACHE_KEYS.UNIVERSITIES.ALL;

        // Check if cached data exists
        const cachedUniversities = await redisClient.get(cacheKey);
        if (cachedUniversities) {
            return res.status(200).json(JSON.parse(cachedUniversities));
        }

        // Aggregation pipeline to get all universities
        const universities = await University.aggregate([
            {
                $lookup: {
                    from: 'accrediations',
                    localField: 'accrediations',
                    foreignField: '_id',
                    as: 'accrediations',
                },
            },
            {
                $lookup: {
                    from: 'universitysubcourses',
                    let: { universityId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$university', '$$universityId'] }
                            }
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
                            $unwind: '$baseSubCourse'
                        },
                        {
                            $addFields: {
                                mergedCourse: {
                                    _id: '$_id',
                                    university: '$university',
                                    name: { 
                                        $ifNull: ['$customName', '$baseSubCourse.subCourseName']
                                    },
                                    shortName: { 
                                        $ifNull: ['$customShortName', '$baseSubCourse.subCourseShortName']
                                    },
                                    code: '$baseSubCourse.code',
                                    duration: '$baseSubCourse.duration',
                                    eligibility: '$baseSubCourse.eligibility',
                                    coursetype: '$baseSubCourse.coursetype',
                                    fees: { 
                                        $ifNull: ['$customFees', '$baseSubCourse.fees']
                                    },
                                    description: { 
                                        $ifNull: ['$customDescription', '$baseSubCourse.subCourseDescription']
                                    },
                                    syllabus: { 
                                        $ifNull: ['$customSyllabus', '$baseSubCourse.syllabus']
                                    },
                                    banners: { 
                                        $cond: {
                                            if: { $gt: [{ $size: { $ifNull: ['$customBanners', []] } }, 0] },
                                            then: '$customBanners',
                                            else: '$baseSubCourse.banners'
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $replaceRoot: { newRoot: '$mergedCourse' }
                        }
                    ],
                    as: 'universitySubCourses',
                },
            },
            {
                $lookup: {
                    from: 'placementpartners',
                    localField: 'placementPartners',
                    foreignField: '_id',
                    as: 'placementPartners',
                },
            },
            {
                $lookup: {
                    from: 'socialmedias',
                    localField: 'socialMediaLinks',
                    foreignField: '_id',
                    as: 'socialMediaLinks',
                },
            },
            {
                $lookup: {
                    from: 'amenities',
                    localField: 'amenities',
                    foreignField: '_id',
                    as: 'amenities',
                },
            },
            {
                $project: {
                    __v: 0,
                    'accrediations.__v': 0,
                    'placementPartners.__v': 0,
                    'socialMediaLinks.__v': 0,
                    'amenities.__v': 0
                }
            }
        ]);

        // Cache the universities data
        await redisClient.setEx(cacheKey, CACHE_TTL.LONG, JSON.stringify(universities));

        res.status(200).json(universities);
    } catch (err) {
        console.error(err, "Error fetching universities");
        res.status(500).json({ error: err.message });
    }
};


// Get University by ID
export const getUniversityById = async (req, res) => {
    try {
        const { id } = req.body;
        const redisClient = req.redisClient;
        const cacheKey = `${CACHE_KEYS.UNIVERSITIES.BY_ID}:${id}`;

        // Check if cached data exists
        const cachedUniversity = await redisClient.get(cacheKey);
        if (cachedUniversity) {
            return res.status(200).json(JSON.parse(cachedUniversity));
        }

        // Aggregation pipeline to get a specific university by ID
        const university = await University.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: 'accrediations',
                    localField: 'accrediations',
                    foreignField: '_id',
                    as: 'accrediations',
                },
            },
            {
                $lookup: {
                    from: 'universitysubcourses',
                    let: { universityId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$university', '$$universityId'] }
                            }
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
                            $unwind: '$baseSubCourse'
                        },
                        {
                            $addFields: {
                                mergedCourse: {
                                    _id: '$_id',
                                    university: '$university',
                                    name: { 
                                        $ifNull: ['$customName', '$baseSubCourse.subCourseName']
                                    },
                                    shortName: { 
                                        $ifNull: ['$customShortName', '$baseSubCourse.subCourseShortName']
                                    },
                                    duration: '$baseSubCourse.duration',
                                    eligibility: '$baseSubCourse.eligibility',
                                    coursetype: '$baseSubCourse.coursetype',
                                    fees: { 
                                        $ifNull: ['$customFees', '$baseSubCourse.fees']
                                    },
                                    description: { 
                                        $ifNull: ['$customDescription', '$baseSubCourse.subCourseDescription']
                                    },
                                    syllabus: { 
                                        $ifNull: ['$customSyllabus', '$baseSubCourse.syllabus']
                                    },
                                    banners: { 
                                        $cond: {
                                            if: { $gt: [{ $size: { $ifNull: ['$customBanners', []] } }, 0] },
                                            then: '$customBanners',
                                            else: '$baseSubCourse.banners'
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $replaceRoot: { newRoot: '$mergedCourse' }
                        }
                    ],
                    as: 'universitySubCourses',
                },
            },
            {
                $lookup: {
                    from: 'placementpartners',
                    localField: 'placementPartners',
                    foreignField: '_id',
                    as: 'placementPartners',
                },
            },
            {
                $lookup: {
                    from: 'socialmedias',
                    localField: 'socialMediaLinks',
                    foreignField: '_id',
                    as: 'socialMediaLinks',
                },
            },
            {
                $lookup: {
                    from: 'amenities',
                    localField: 'amenities',
                    foreignField: '_id',
                    as: 'amenities',
                },
            },
            {
                $project: {
                    __v: 0,
                    'accrediations.__v': 0,
                    'placementPartners.__v': 0,
                    'socialMediaLinks.__v': 0,
                    'amenities.__v': 0
                }
            }
        ]);

        // If no university is found, return a 404 error
        if (!university.length) {
            return res.status(404).json({ message: 'University not found' });
        }

        // Cache the university data
        await redisClient.setEx(cacheKey, CACHE_TTL.MEDIUM, JSON.stringify(university[0]));

        res.status(200).json(university[0]);
    } catch (err) {
        console.error(err, "Error fetching university by ID");
        res.status(500).json({ error: err.message });
    }
};



// Edit University
export const editUniversity = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const redisClient = req.redisClient;
        const { id } = req.body;

         // Invalidate caches before making any changes
         await Promise.all([
            redisClient.del(`${CACHE_KEYS.UNIVERSITIES.BY_ID}:${id}`),
            redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL)
        ]);

        // Check if university exists
        const university = await University.findById(id);
        if (!university) {
            return res.status(404).json({ message: "University not found" });
        }

        // Validate input using Zod schema
        addUniversityValidationSchema.parse(req.body);
        const { 
            universityName, 
            universityShortName, 
            tagLine, 
            universityLink, 
            about, 
            accrediations, 
            universitySubCourses, 
            admissionProcess, 
            examinationPattern, 
            placementPartners, 
            socialMediaLinks, 
            amenities 
        } = req.body;

        const updateFields = {};
        if (universityName) updateFields.universityName = universityName.toLowerCase();
        if (universityShortName) updateFields.universityShortName = universityShortName.toLowerCase();
        if (tagLine) updateFields.tagLine = tagLine;
        if (universityLink) updateFields.universityLink = universityLink;
        if (about) updateFields.about = about;
        if (accrediations) updateFields.accrediations = accrediations;
        if (admissionProcess) updateFields.admissionProcess = admissionProcess;
        if (examinationPattern) updateFields.examinationPattern = examinationPattern;
        if (placementPartners) updateFields.placementPartners = placementPartners;
        if (socialMediaLinks) updateFields.socialMediaLinks = socialMediaLinks;
        if (amenities) updateFields.amenities = amenities;

        // Check for duplicate university names
        const existingUniversity = await University.findOne({ 
            _id: { $ne: id },
            $or: [
                { universityName: updateFields.universityName },
                { universityShortName: updateFields.universityShortName }
            ] 
        });
        if (existingUniversity) {
            return res.status(409).json({ message: "A university with this name or short name already exists." });
        }

        // Extract subcourse IDs for validation
        const subCourseIds = universitySubCourses?.map(course => 
            typeof course === 'string' ? course : course.subCourseId
        ) || [];

        // Validate IDs for related models if they are provided
        const [validAccrediations, validSubCourses, validSocialMediaLinks, validPlacementPartners, validAmenities] = await Promise.all([
            accrediations ? fetchAndCacheIDs(redisClient, CACHE_KEYS.ACCREDITATION.ALL, Accrediation, accrediations, CACHE_TTL.MEDIUM) : [],
            subCourseIds.length ? fetchAndCacheIDs(redisClient, CACHE_KEYS.SUB_COURSES.ALL, SubCourse, subCourseIds, CACHE_TTL.MEDIUM) : [],
            socialMediaLinks ? fetchAndCacheIDs(redisClient, CACHE_KEYS.SOCIAL_MEDIA.ALL, SocialMedia, Array.isArray(socialMediaLinks) ? socialMediaLinks : [socialMediaLinks], CACHE_TTL.MEDIUM) : [],
            placementPartners ? fetchAndCacheIDs(redisClient, CACHE_KEYS.PLACEMENT_PARTNERS.ALL, PlacementPartner, placementPartners, CACHE_TTL.MEDIUM) : [],
            amenities ? fetchAndCacheIDs(redisClient, CACHE_KEYS.AMENITIES.ALL, Amenity, amenities, CACHE_TTL.MEDIUM) : []
        ]);

        // Validation checks
        if (accrediations && validAccrediations.length !== accrediations.length) {
            return res.status(400).json({ message: "Invalid accreditation IDs" });
        }
        if (subCourseIds.length && validSubCourses.length !== subCourseIds.length) {
            return res.status(400).json({ message: "Invalid sub-course IDs" });
        }
        if (socialMediaLinks && validSocialMediaLinks.length !== socialMediaLinks.length) {
            return res.status(400).json({ message: "Invalid social media link IDs" });
        }
        if (placementPartners && validPlacementPartners.length !== placementPartners.length) {
            return res.status(400).json({ message: "Invalid placement partner IDs" });
        }
        if (amenities && validAmenities.length !== amenities.length) {
            return res.status(400).json({ message: "Invalid amenity IDs" });
        }

        // Update the university
        const updatedUniversity = await University.findByIdAndUpdate(
            id, 
            { $set: updateFields }, 
            { new: true, session }
        );

        if (universitySubCourses) {
            // Delete existing university subcourses
            await UniversitySubCourse.deleteMany({ 
                university: id 
            }, { session });

            // Create new university subcourses with custom data
            const universitySubCoursesToSave = universitySubCourses.map(course => {
                if (typeof course === 'string') {
                    return {
                        university: id,
                        subCourse: course
                    };
                }

                return {
                    university: id,
                    subCourse: course.subCourseId,
                    customFees: course.customFees,
                    customDescription: course.customDescription,
                    // customSyllabus: course.customSyllabus,
                    // customBanners: course.customBanners
                };
            });

            // Insert new university subcourses
            await UniversitySubCourse.insertMany(universitySubCoursesToSave, { session });
        }

        await session.commitTransaction();

        // Invalidate the university cache after editing
        await redisClient.del(CACHE_KEYS.UNIVERSITIES.BY_ID(id));
        await redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL);

        // Cache the updated university data
        await redisClient.setEx(
            CACHE_KEYS.UNIVERSITIES.BY_ID(id), 
            CACHE_TTL.LONG, 
            JSON.stringify(updatedUniversity)
        );

        res.status(200).json({ 
            message: "University updated successfully", 
            updatedUniversity 
        });

    } catch (err) {
        await session.abortTransaction();
        console.error(err, "Error editing university");
        if (err instanceof z.ZodError) {
            return res.status(422).json({ errors: err.errors });
        }
        res.status(500).json({ error: err.message });
    } finally {
        session.endSession();
    }
};


// Delete University
export const deleteUniversity = async (req, res) => {
  try {
      const redisClient = req.redisClient;
      const { id } = req.body;

      // Validate ID
      if (!isValidObjectId(id)) {
          return res.status(400).json({ message: "Invalid university ID" });
      }

      const deletedUniversity = await University.findByIdAndDelete(id);

      if (!deletedUniversity) {
          return res.status(404).json({ message: "University not found" });
      }

      // Invalidate the university cache after deletion
      await redisClient.del(CACHE_KEYS.UNIVERSITIES.BY_ID(id));
      redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL); // Optionally clear all universities cache

      res.status(200).json({ message: "University deleted successfully", id });
  } catch (err) {
      console.error(err, "Error deleting university");
      res.status(500).json({ error: err.message });
  }
};
