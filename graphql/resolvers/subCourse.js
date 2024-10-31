import { GraphQLError } from "graphql";
import SubCourse from "../../models/SubCourse.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";
import { storageService } from "../../utils/storage.js";
import { addSubCourseValidationSchema } from "../../validations/subCourse.js";

const DEFAULT_BANNER = {
    url: "https://foundr.com/wp-content/uploads/2021/09/Best-online-course-platforms.png"
};

const resolvers = {
    Query: {
        getSubCourses: async (_, __, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                // Check cache
                const cachedSubCourses = await redisClient.get(CACHE_KEYS.SUB_COURSES.ALL);
                if (cachedSubCourses) {
                    return JSON.parse(cachedSubCourses);
                }

                const subCourses = await SubCourse.find();
                await redisClient.set(CACHE_KEYS.SUB_COURSES.ALL, JSON.stringify(subCourses), {
                    EX: CACHE_TTL.LONG,
                });
                return subCourses;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    },
    Mutation: {
        addSubCourse: async (_, { input }, { redisClient, isAdmin }) => {
            console.log("Starting addSubCourse mutation");
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                const {
                    subCourseName,
                    subCourseShortName,
                    subCourseDescription,
                    fees,
                    course,
                    banners,
                    syllabus
                } = input;
                console.log("Input received:", input);
                // Validate input using Zod schema
                const validationResult = addSubCourseValidationSchema.safeParse(input);

                if (!validationResult.success) {
                    console.log("Validation failed:", validationResult.error.formErrors); // Validation error
                    throw new GraphQLError('Invalid input', {
                        extensions: {
                            code: 'BAD_USER_INPUT',
                            errors: validationResult.error.formErrors.fieldErrors,
                        },
                    });
                }

                // Convert names to lowercase
                const lowerCaseSubCourseShortName = subCourseShortName.toLowerCase();
                const lowerCaseSubCourseName = subCourseName.toLowerCase();
                console.log("Converted names to lowercase");

                // Check if sub-course already exists
                const existingSubCourse = await SubCourse.findOne({
                    $or: [
                        { subCourseName: lowerCaseSubCourseName },
                        { subCourseShortName: lowerCaseSubCourseShortName }
                    ]
                });
                console.log("Checked for existing sub-course:", existingSubCourse); // Existing sub-course check

                if (existingSubCourse) {
                    throw new GraphQLError('Sub-course with this name or short name already exists', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Handle banner uploads
                let bannerUrls = [];

                if (banners && Array.isArray(banners) && banners.length > 0) {
                    console.log("Processing banners:", banners);

                    // Filter out null values first
                    const nonNullBanners = banners.filter(banner => banner !== null);

                    if (nonNullBanners.length > 0) {
                        for (const banner of nonNullBanners) {
                            try {
                                const upload = await banner; // Resolve the upload promise
                                if (!upload) continue;

                                const url = await storageService.saveImage(upload, 'banners');
                                console.log("Uploaded banner:", url);
                                bannerUrls.push({ url });
                            } catch (error) {
                                console.error('Error uploading banner:', error);
                            }
                        }
                    }
                }

                // If no banners were provided or all uploads failed, use the default banner
                if (bannerUrls.length === 0) {
                    bannerUrls = [DEFAULT_BANNER];
                }

                // Handle syllabus upload
                let syllabusUrl = null;
                if (syllabus) {
                    try {
                        const upload = await syllabus; // Resolve the upload promise
                        if (upload) {
                            syllabusUrl = await storageService.saveImage(upload, 'syllabus');
                            console.log("Uploaded syllabus:", syllabusUrl);
                        }
                    } catch (error) {
                        console.error('Error uploading syllabus:', error);
                        throw new GraphQLError('Failed to upload syllabus', {
                            extensions: { code: 'UPLOAD_FAILED' },
                        });
                    }
                }

                // Create and save new sub-course
                console.log("Creating new sub-course entry");
                const subCourse = new SubCourse({
                    subCourseName: lowerCaseSubCourseName,
                    subCourseShortName: lowerCaseSubCourseShortName,
                    subCourseDescription,
                    fees,
                    course,
                    banners: bannerUrls,
                    syllabus: syllabusUrl
                });

                await subCourse.save();

                // Invalidate cache
                await redisClient.del(CACHE_KEYS.SUB_COURSES.ALL);
                console.log("Cache invalidated");
                return subCourse;
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                console.error('Error in addSubCourse:', error);
                throw new GraphQLError('Failed to create sub-course', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
        updateSubCourse: async (_, { id, input }, { redisClient, isAdmin }) => {
            try {
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                const validationResult = addSubCourseValidationSchema.safeParse(input);
                if (!validationResult.success) {
                    throw new GraphQLError('Invalid input', {
                        extensions: {
                            code: 'BAD_USER_INPUT',
                            errors: validationResult.error.formErrors.fieldErrors,
                        },
                    });
                }

                const {
                    id,
                    subCourseName,
                    subCourseShortName,
                    subCourseDescription,
                    fees,
                    course,
                    banners,
                    syllabus
                } = input;

                const existingSubCourse = await SubCourse.findById(id);
                if (!existingSubCourse) {
                    throw new GraphQLError('Sub-course not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

               
                if (subCourseName) existingSubCourse.subCourseName = subCourseName.toLowerCase();
                if (subCourseShortName) existingSubCourse.subCourseShortName = subCourseShortName.toLowerCase();
                if (subCourseDescription) existingSubCourse.subCourseDescription = subCourseDescription;
                if (fees) existingSubCourse.fees = fees;
                if (course) existingSubCourse.course = course;

                if (banners && Array.isArray(banners)) {
                    let bannerUrls = [];
                    for (const banner of banners) {
                        if (banner) {
                            const url = await storageService.saveImage(await banner, 'banners');
                            bannerUrls.push({ url });
                        }
                    }
                    existingSubCourse.banners = bannerUrls.length > 0 ? bannerUrls : [DEFAULT_BANNER];
                }

                if (syllabus) {
                    const syllabusUrl = await storageService.saveImage(await syllabus, 'syllabus');
                    existingSubCourse.syllabus = syllabusUrl;
                }

                Object.assign(existingSubCourse);
                await existingSubCourse.save();

                await redisClient.del(CACHE_KEYS.SUB_COURSES.ALL);
                return existingSubCourse;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        deleteSubCourse: async (_, { id }, { redisClient, isAdmin }) => {
            try {
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                const subCourse = await SubCourse.findByIdAndDelete(id);
                if (!subCourse) {
                    throw new GraphQLError('Sub-course not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                await redisClient.del(CACHE_KEYS.SUB_COURSES.ALL);
                return subCourse;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    }
};

export default resolvers;