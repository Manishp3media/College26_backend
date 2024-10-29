import { GraphQLError } from "graphql";
import Accrediation from "../../models/Accrediation.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";
import { storageService } from "../../utils/storage.js";
import { accrediationValidationSchema } from "../../validations/accrediation.js";

const resolvers = {
    Query: {
        getAccrediations: async (_, __, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                // Check cache
                const cachedAccrediations = await redisClient.get(CACHE_KEYS.ACCREDITATION.ALL);
                if (cachedAccrediations) {
                    return JSON.parse(cachedAccrediations);
                }

                // get all accrediations from mongodb
                const accrediations = await Accrediation.find();

                // Set cache
                await redisClient.setEx(
                    CACHE_KEYS.ACCREDITATION.ALL,
                    CACHE_TTL.MEDIUM,
                    JSON.stringify(accrediations)
                );

                return accrediations;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    },
    
    Mutation: {
        addAccrediation: async (_, { input }, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                const { name, logo } = input;

                // Validate input
                const validation = accrediationValidationSchema.safeParse(input);
                if (!validation.success) {
                    throw new GraphQLError('Invalid input', {
                        extensions: {
                            code: 'BAD_USER_INPUT',
                            errors: validation.error.flatten().fieldErrors,
                        },
                    });
                }

                const upload = await logo;

                if (!upload) {
                    throw new GraphQLError('File upload failed');
                }

                const lowerCaseName = name.toLowerCase();

                // Check if amenity exists
                const existingAccrediation = await Accrediation.findOne({ name: lowerCaseName });
                if (existingAccrediation) {
                    throw new GraphQLError('Accrediation already exists');
                }

                // Save image
                const logoUrl = await storageService.saveImage(upload, 'accrediations');

                const newAccrediation = new Accrediation({
                    name: lowerCaseName,
                    logo: logoUrl,
                });

                await newAccrediation.save();

                // Invalidate the streams cache
                await redisClient.del(CACHE_KEYS.ACCREDITATION.ALL);

                return newAccrediation;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    }
};

export default resolvers;