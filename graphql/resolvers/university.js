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

// // Helper function to validate MongoDB ObjectIds
// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// // Helper function to validate IDs directly from MongoDB
// const validateIDs = async (model, ids) => {
//     // First validate that all IDs are valid ObjectIds
//     const invalidIds = ids.filter(id => !isValidObjectId(id));
//     if (invalidIds.length > 0) {
//         throw new Error(`Invalid ObjectIds found: ${invalidIds.join(', ')}`);
//     }

//     const result = await model.find({ _id: { $in: ids } });
//     // Filter to only include requested IDs
//     return result.filter(item => ids.includes(item._id.toString()));
// };

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
    Query: {
        getAllUniversities: async (_, __, { isAdmin, redisClient }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                const cachedUniversities = await redisClient.get(CACHE_KEYS.UNIVERSITIES.ALL);

                if (cachedUniversities) {
                    return JSON.parse(cachedUniversities);
                }

                const universities = await University.find({})
                // .populate('placementPartners', 'name logo') 
                // .populate('accrediations', 'name logo')      
                // .populate('socialMediaLinks', 'name url')      
                // .populate('amenities', 'name iconName')   
                // .lean();

                if (!universities || universities.length === 0) {
                    throw new GraphQLError('No universities found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                await redisClient.set(CACHE_KEYS.UNIVERSITIES.ALL, JSON.stringify(universities), {
                    EX: CACHE_TTL.LONG,
                });

                return universities;

            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;  // Pass through the specific error message
                }
                console.error('Error fetching universities:', error);
                throw new GraphQLError('Failed to fetch universities', {
                    extensions: { code: 'FETCH_FAILED' },
                });
            }
        }
    },
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
        
                const { 
                    universityName, 
                    universityShortName, 
                    universityLink, 
                    universityLogo, 
                    banners, 
                    brochure, 
                    tagLine, 
                    about,
                    universitySubCourses, 
                    accrediations, 
                    admissionProcess, 
                    examinationPattern, 
                    placementPartners, 
                    socialMediaLinks, 
                    amenities 
                } = input;
        
                // Extract all custom banners and syllabi from universitySubCourses
                const customBannersArrays = universitySubCourses
                    ?.filter(course => typeof course !== 'string' && course.customBanners)
                    ?.map(course => course.customBanners) || [];
                
                const customSyllabiFiles = universitySubCourses
                    ?.filter(course => typeof course !== 'string' && course.customSyllabus)
                    ?.map(course => course.customSyllabus) || [];
        
                // Handle all file uploads concurrently at the start
                const [
                    bannerUrls,
                    universityLogoUrl,
                    brochureUrl,
                    examinationPatternDocumentUrl,
                    customBannerUrlsArrays,
                    customSyllabiUrls
                ] = await Promise.all([
                    validateAndUploadFiles(banners, 'banners'),
                    uploadSingleFile(universityLogo, 'university-logo'),
                    uploadSingleFile(brochure, 'brochure'),
                    examinationPattern?.document ? uploadSingleFile(examinationPattern.document, 'examination-pattern') : null,
                    Promise.all(customBannersArrays.map(bannerArray => 
                        validateAndUploadFiles(bannerArray, 'custom-banners')
                    )),
                    Promise.all(customSyllabiFiles.map(syllabus =>
                        uploadSingleFile(syllabus, 'custom-syllabus')
                    ))
                ]);
        
                // Use default banner if no banners were uploaded successfully
                const finalBannerUrls = bannerUrls.length > 0 ? bannerUrls : [DEFAULT_BANNER];
        
                // Create a map of uploaded files for easy access when processing subcourses
                const uploadedFilesMap = {
                    customBanners: customBannerUrlsArrays,
                    customSyllabus: customSyllabiUrls
                };
        
                // Rest of the university creation logic...
                const lowerCaseUniversityName = universityName.toLowerCase();
                const lowerCaseUniversityShortName = universityShortName.toLowerCase();
        
                const existingUniversity = await University.findOne({
                    $or: [
                        { universityName: lowerCaseUniversityName },
                        { universityShortName: lowerCaseUniversityShortName }
                    ]
                });
        
                if (existingUniversity) {
                    throw new GraphQLError('University with this name or short name already exists', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }
        
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
                    examinationPattern: {
                        description: examinationPattern?.description,
                        document: examinationPatternDocumentUrl,
                    },
                    placementPartners,
                    socialMediaLinks,
                    amenities,
                    about
                });
        
                await newUniversity.save({ session });
        
                const saveUniversitySubCoursesWithPopulation = async (universitySubCourses, newUniversity, session, uploadedFilesMap) => {
                    const subCourseIds = universitySubCourses?.map(course =>
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
        
                    let customBannersIndex = 0;
                    let customSyllabusIndex = 0;
        
                    const universitySubCoursesToSave = await Promise.all(universitySubCourses.map(async course => {
                        const subCourseId = typeof course === 'string' ? course : course.subCourseId;
                        const subCourse = subCoursesMap[subCourseId.toString()];
        
                        if (!subCourse) {
                            throw new Error(`SubCourse with ID ${subCourseId} not found`);
                        }
        
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
        
                        if (typeof course !== 'string') {
                            // Use pre-uploaded custom banners
                            if (course.customBanners && course.customBanners.length > 0) {
                                baseObject.customBanners = uploadedFilesMap.customBanners[customBannersIndex++];
                            }
        
                            // Use pre-uploaded custom syllabus
                            if (course.customSyllabus) {
                                baseObject.customSyllabus = uploadedFilesMap.customSyllabus[customSyllabusIndex++];
                            }
        
                            // Handle other custom fields
                            if (course.customFees != null) baseObject.customFees = course.customFees;
                            if (course.customDescription != null) baseObject.customDescription = course.customDescription;
                            if (course.customName != null) baseObject.customName = course.customName;
                            if (course.customShortName != null) baseObject.customShortName = course.customShortName;
                        }
        
                        return baseObject;
                    }));
        
                    const savedUniversitySubCourses = await UniversitySubCourse
                        .insertMany(universitySubCoursesToSave, { session });
        
                    return await UniversitySubCourse
                        .find({ _id: { $in: savedUniversitySubCourses.map(doc => doc._id) } })
                        .populate({
                            path: 'subCourse',
                            select: 'subCourseName subCourseShortName banners subCourseDescription syllabus fees'
                        })
                        .session(session);
                };
        
                try {
                    const savedUniversitySubCourses = await saveUniversitySubCoursesWithPopulation(
                        universitySubCourses,
                        newUniversity,
                        session,
                        uploadedFilesMap
                    );
        
                    // Invalidate the university cache
                    redisClient.del(CACHE_KEYS.UNIVERSITIES.ALL);
        
                    await session.commitTransaction();
                    session.endSession();
        
                    return newUniversity;
        
                } catch (error) {
                    if (error instanceof GraphQLError) {
                        throw error;
                    }
                    console.log('Error adding university:', error);
                    throw new GraphQLError('Failed to add university', {
                        extensions: { code: 'ADD_FAILED' },
                    });
                }
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                if (error instanceof GraphQLError) {
                    throw error;
                }
                console.log('Error adding university:', error);
                throw new GraphQLError('Failed to add university', {
                    extensions: { code: 'ADD_FAILED' },
                });
            }
        }
    }
};

export default resolvers;


// // Validate all IDs directly from MongoDB
// const [validAccrediations, validSubCourses, validSocialMediaLinks, validPlacementPartners, validAmenities] = await Promise.all([
//     validateIDs(Accrediation, accrediations),
//     validateIDs(SubCourse, subCourseIds),
//     validateIDs(SocialMedia, Array.isArray(socialMediaLinks) ? socialMediaLinks : [socialMediaLinks]),
//     validateIDs(PlacementPartner, placementPartners),
//     validateIDs(Amenity, amenities)
// ]);

// // Validation checks
// if (validAccrediations.length !== accrediations.length) {
//     throw new GraphQLError('Invalid accreditation IDs', {
//         extensions: { code: 'BAD_USER_INPUT' },
//     })
// }
// if (validSubCourses.length !== subCourseIds.length) {
//     throw new GraphQLError('Invalid subcourse IDs', {
//         extensions: { code: 'BAD_USER_INPUT' },
//     })
// // }
// if (validSocialMediaLinks.length !== socialMediaLinks.length) {
//     throw new GraphQLError('Invalid social media link IDs', {
//         extensions: { code: 'BAD_USER_INPUT' },
//     })
// }
// if (validPlacementPartners.length !== placementPartners.length) {
//     throw new GraphQLError('Invalid placement partner IDs', {
//         extensions: { code: 'BAD_USER_INPUT' },
//     })
// }
// if (validAmenities.length !== amenities.length) {
//     throw new GraphQLError('Invalid amenity IDs', {
//         extensions: { code: 'BAD_USER_INPUT' },
//     })
// }