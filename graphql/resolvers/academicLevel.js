import AcademicLevel from "../../models/AcademicLevel.js";
import { GraphQLError } from "graphql";
import { addAcademicLevelValidationSchema } from "../../validations/AcademicLevel.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";

const resolvers = {
    Query: {
        getAcademicLevels: async (_, __, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                // Check cache
                const cachedAcademicLevels = await redisClient.get(CACHE_KEYS.ACADEMIC_LEVEL.ALL);
                if (cachedAcademicLevels) {
                    return JSON.parse(cachedAcademicLevels);
                }

                // const academicLevels = await AcademicLevel.find().populate('streams');
                const academicLevels = await AcademicLevel.find();

                // Set cache
                await redisClient.setEx(
                    CACHE_KEYS.ACADEMIC_LEVEL.ALL,
                    CACHE_TTL.LONG, // 1 hour cache
                    JSON.stringify(academicLevels)
                );

                return academicLevels;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    },

    Mutation: {
        addAcademicLevel: async (_, { input }, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                // Validate input
                const validation = addAcademicLevelValidationSchema.safeParse(input);
                if (!validation.success) {
                    throw new GraphQLError('Invalid input', {
                        extensions: {
                            code: 'BAD_USER_INPUT',
                            errors: validation.error.flatten().fieldErrors,
                        },
                    });
                }

                const { name } = input;

                // Convert name to lowercase
                const lowerCaseName = name.toLowerCase();

                // Check if the name already exists
                const existingAcademicLevel = await AcademicLevel.findOne({ name: lowerCaseName });
                if (existingAcademicLevel) {
                    throw new GraphQLError('Academic level already exists', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Create new Academic Level
                const newAcademicLevel = new AcademicLevel({ name: lowerCaseName });
                await newAcademicLevel.save();

                // Invalidate the streams cache
                await redisClient.del(CACHE_KEYS.ACADEMIC_LEVEL.ALL);
                return newAcademicLevel;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    }
}

export default resolvers;