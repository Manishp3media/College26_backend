import University from "../../models/University.js";
import PlacementPartner from "../../models/PlacementParnter.js";
import Amenity from "../../models/Amenity.js";
import Accrediation from "../../models/Accrediation.js";
import SocialMedia from "../../models/SocialMedia.js";
import UniversitySubCourse from "../../models/UniversitySubCourse.js";
import SubCourse from "../../models/SubCourse.js";
import mongoose from "mongoose";
import { storageService } from "../../utils/storage.js";
import { GraphQLError } from "graphql";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";

// Helper function to validate MongoDB ObjectIds
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to validate IDs directly from MongoDB
const validateIDs = async (model, ids) => {
    // First validate that all IDs are valid ObjectIds
    const invalidIds = ids.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
        throw new Error(`Invalid ObjectIds found: ${invalidIds.join(', ')}`);
    }

    const result = await model.find({ _id: { $in: ids } });
    // Filter to only include requested IDs
    return result.filter(item => ids.includes(item._id.toString()));
};

const validateAndUploadFiles = async (files, folder) => {
    if (!files || !Array.isArray(files)) return [];

    const uploadPromises = files
        .filter(file => file !== null)
        .map(async (file) => {
            try {
                const resolvedFile = await Promise.resolve(file);
                if (!resolvedFile) return null;

                const url = await storageService.saveImage(resolvedFile, folder);
                return { url };
            } catch (error) {
                console.error(`Error uploading file to ${folder}:`, error);
                return null;
            }
        });

    const results = await Promise.all(uploadPromises);
    return results.filter(result => result !== null);
}

const uploadSingleFile = async (file, folder) => {
    if (!file) return null;

    try {
        const resolvedFile = await Promise.resolve(file);
        if (!resolvedFile) return null;

        return await storageService.saveImage(resolvedFile, folder);
    } catch (error) {
        console.error(`Error uploading file to ${folder}:`, error);
        return null;
    }
};

const DEFAULT_BANNER = {
    url: "https://foundr.com/wp-content/uploads/2021/09/Best-online-course-platforms.png"
};

export const resolvers = {
    Query: {},
    Mutation: {
        addUniversity: async (_, { input }, { redisClient, isAdmin }) => {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }


                const { universityName, universityShortName, universityLink, universityLogo, banners, brochure, tagLine, about, universitySubCourses, accrediations, admissionProcess, examinationPattern, placementPartners, socialMediaLinks, amenities } = input;

                // log input
                console.log(input);

                // Convert name to lowercase
                const lowerCaseUniversityName = universityName.toLowerCase();
                const lowerCaseUniversityShortName = universityShortName.toLowerCase();

                const existingUniversity = await University.findOne({ $or: [{ universityName: lowerCaseUniversityName }, { universityShortName: lowerCaseUniversityShortName }] });
                if (existingUniversity) {
                    throw new GraphQLError('University with this name or short name already exists', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Validate that all subcourse IDs exist
                const subCourseIds = universitySubCourses.map(course =>
                    typeof course === 'string' ? course : course.subCourseId
                );

                // Validate all IDs directly from MongoDB
                const [validAccrediations, validSubCourses, validSocialMediaLinks, validPlacementPartners, validAmenities] = await Promise.all([
                    validateIDs(Accrediation, accrediations),
                    validateIDs(SubCourse, subCourseIds),
                    validateIDs(SocialMedia, Array.isArray(socialMediaLinks) ? socialMediaLinks : [socialMediaLinks]),
                    validateIDs(PlacementPartner, placementPartners),
                    validateIDs(Amenity, amenities)
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

                // // Handle banner uploads
                // let bannerUrls = [];

                // if (banners && Array.isArray(banners) && banners.length > 0) {
                //     console.log("Processing banners:", banners);

                //     // Filter out null values first
                //     const nonNullBanners = banners.filter(banner => banner !== null);

                //     if (nonNullBanners.length > 0) {
                //         for (const banner of nonNullBanners) {
                //             try {
                //                 const upload = await banner; // Resolve the upload promise
                //                 if (!upload) continue;

                //                 const url = await storageService.saveImage(upload, 'banners');
                //                 console.log("Uploaded banner:", url);
                //                 bannerUrls.push({ url });
                //             } catch (error) {
                //                 console.error('Error uploading banner:', error);
                //             }
                //         }
                //     }
                // }

                // // If no banners were provided or all uploads failed, use the default banner
                // if (bannerUrls.length === 0) {
                //     bannerUrls = [DEFAULT_BANNER];
                // }

                // // Handle logo upload
                // let universityLogoUrl = null;
                // if (universityLogo) {
                //     try {
                //         const upload = await universityLogo; // Resolve the upload promise
                //         if (upload) {
                //             universityLogoUrl = await storageService.saveImage(upload, 'university-logo');
                //             console.log("Uploaded logo:", universityLogo);
                //         }
                //     } catch (error) {
                //         console.error('Error uploading syllabus:', error);
                //         throw new GraphQLError('Failed to upload logo', {
                //             extensions: { code: 'UPLOAD_FAILED' },
                //         });
                //     }
                // }

                // // Handle brochure upload
                // let brochureUrl = null;
                // if (brochure) {
                //     try {
                //         const upload = await brochure; // Resolve the upload promise
                //         if (upload) {
                //             brochureUrl = await storageService.saveImage(upload, 'brochure');
                //             console.log("Uploaded brochure:", brochureUrl);
                //         }
                //     } catch (error) {
                //         console.error('Error uploading brochure:', error);
                //         throw new GraphQLError('Failed to upload brochure', {
                //             extensions: { code: 'UPLOAD_FAILED' },
                //         });
                //     }
                // }

                // Handle all file uploads concurrently
                const [bannerUrls, universityLogoUrl, brochureUrl] = await Promise.all([
                    validateAndUploadFiles(banners, 'banners'),
                    uploadSingleFile(universityLogo, 'university-logo'),
                    uploadSingleFile(brochure, 'brochure')
                ]);

                // Use default banner if no banners were uploaded successfully
                const finalBannerUrls = bannerUrls.length > 0 ? bannerUrls : [DEFAULT_BANNER];

                const newUniversity = new University({
                    universityName: lowerCaseUniversityName,
                    universityShortName: lowerCaseUniversityShortName,
                    universityLink,
                    universityLogo: universityLogoUrl,
                    banners: finalBannerUrls,
                    brochure: brochureUrl,
                    tagLine,
                    accrediations,
                    admissionProcess,
                    examinationPattern,
                    placementPartners,
                    socialMediaLinks,
                    amenities,
                    about
                });

                await newUniversity.save({ session });
                console.log("session saved");

                const saveUniversitySubCoursesWithPopulation = async (universitySubCourses, newUniversity, session) => {
                    const subCourseIds = universitySubCourses.map(course =>
                        typeof course === 'string' ? course : course.subCourseId
                    );

                    const subCoursesMap = await mongoose.model('SubCourse')
                        .find({ _id: { $in: subCourseIds } })
                        .session(session)
                        .then(courses => {
                            return courses.reduce((acc, course) => {
                                acc[course._id.toString()] = course;
                                return acc;
                            }, {});
                        });

                    const universitySubCoursesToSave = await Promise.all(universitySubCourses.map(async course => {
                        const subCourseId = typeof course === 'string' ? course : course.subCourseId;
                        const subCourse = subCoursesMap[subCourseId.toString()];

                        if (!subCourse) {
                            throw new Error(`SubCourse with ID ${subCourseId} not found`);
                        }

                        // Create base object with default values from subCourse
                        const baseObject = {
                            university: newUniversity._id,
                            subCourse: subCourseId,
                            customFees: subCourse.fees,
                            customDescription: subCourse.subCourseDescription,
                            customSyllabus: subCourse.syllabus,
                            customName: subCourse.subCourseName,
                            customShortName: subCourse.subCourseShortName,
                            customBanners: subCourse.banners
                        };

                        // If course is an object (not just a string ID), handle custom uploads and values
                        if (typeof course !== 'string') {
                            // Handle custom banner uploads
                            let customBannerUrls = [];
                            if (course.customBanners && Array.isArray(course.customBanners) && course.customBanners.length > 0) {
                                console.log("Processing custom banners:", course.customBanners);

                                // Filter out null values first
                                const nonNullBanners = course.customBanners.filter(banner => banner !== null);

                                if (nonNullBanners.length > 0) {
                                    for (const banner of nonNullBanners) {
                                        try {
                                            const upload = await banner; // Resolve the upload promise
                                            if (!upload) continue;

                                            const url = await storageService.saveImage(upload, 'custom-banners');
                                            console.log("Uploaded custom banner:", url);
                                            customBannerUrls.push({ url });
                                        } catch (error) {
                                            console.error('Error uploading custom banner:', error);
                                        }
                                    }
                                }
                            }

                            // If custom banners were successfully uploaded, update baseObject
                            if (customBannerUrls.length > 0) {
                                baseObject.customBanners = customBannerUrls;
                            }

                            // Handle custom syllabus upload
                            if (course.customSyllabus) {
                                try {
                                    const upload = await course.customSyllabus;
                                    if (upload) {
                                        const customSyllabusUrl = await storageService.saveImage(upload, 'custom-syllabus');
                                        console.log("Uploaded custom syllabus:", customSyllabusUrl);
                                        baseObject.customSyllabus = customSyllabusUrl;
                                    }
                                } catch (error) {
                                    console.error('Error uploading custom syllabus:', error);
                                    throw new GraphQLError('Failed to upload custom syllabus', {
                                        extensions: { code: 'UPLOAD_FAILED' },
                                    });
                                }
                            }

                            // Handle other custom fields
                            if (course.customFees != null) baseObject.customFees = course.customFees;
                            if (course.customDescription != null) baseObject.customDescription = course.customDescription;
                            if (course.customName != null) baseObject.customName = course.customName;
                            if (course.customShortName != null) baseObject.customShortName = course.customShortName;
                        }

                        console.log("Final baseObject:", baseObject);
                        return baseObject;
                    }));

                    // Save all university sub courses
                    const savedUniversitySubCourses = await UniversitySubCourse
                        .insertMany(universitySubCoursesToSave, { session });

                    // Fetch the saved documents with populated subCourse field
                    const populatedUniversitySubCourses = await UniversitySubCourse
                        .find({ _id: { $in: savedUniversitySubCourses.map(doc => doc._id) } })
                        .populate({
                            path: 'subCourse',
                            select: 'subCourseName subCourseShortName banners subCourseDescription syllabus fees'
                        })
                        .session(session);

                    console.log("Populated universitySubCourses:", populatedUniversitySubCourses);

                    return populatedUniversitySubCourses;
                };

                // Usage in your transaction
                try {
                    const savedUniversitySubCourses = await saveUniversitySubCoursesWithPopulation(
                        universitySubCourses,
                        newUniversity,
                        session
                    );

                    savedUniversitySubCourses.forEach(savedUniversitySubCourse => {
                        console.log("savedUniversitySubCourse:", {
                            _id: savedUniversitySubCourse._id,
                            university: savedUniversitySubCourse.university,
                            subCourse: savedUniversitySubCourse.subCourse,
                            fees: savedUniversitySubCourse.customFees, // This will use the virtual getter
                            description: savedUniversitySubCourse.description, // This will use the virtual getter
                            syllabus: savedUniversitySubCourse.syllabus, // This will use the virtual getter
                            banners: savedUniversitySubCourse.banners // This will use the virtual getter
                        });
                    });
                } catch (error) {
                    console.error('Error saving university sub courses:', error);
                    throw error;
                }

                // Invalidate the university cache
                redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL);

                await session.commitTransaction();
                session.endSession();

                return newUniversity;

            } catch (error) {
                // Check if this error is already a GraphQLError with a specific message
                if (error instanceof GraphQLError) {
                    throw error;  // Pass through the specific error message
                }

                // For unexpected errors, throw a generic message
                throw new GraphQLError('Failed to add university', {
                    extensions: { code: 'ADD_FAILED' },
                });
            }
        }
    }
};

export default resolvers;