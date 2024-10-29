import { GraphQLError } from "graphql";
import PlacementPartner from "../../models/PlacementParnter.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";
import { storageService } from "../../utils/storage.js";

const resolvers = {
    Query: {
        getPlacementPartners: async (_, __, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                const cached = await redisClient.get(CACHE_KEYS.PLACEMENT_PARTNERS.ALL);

                if (cached) {
                    return JSON.parse(cached);
                }

                // Get all placement partners
                const placementPartners = await PlacementPartner.find();
                await redisClient.setEx(
                    CACHE_KEYS.PLACEMENT_PARTNERS.ALL,
                    CACHE_TTL.MEDIUM,
                    JSON.stringify(placementPartners));

                return placementPartners;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    },

    Mutation: {
        addPlacementPartner: async (_, { name, logo }, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }
                const upload = await logo;

                if (!upload) {
                    throw new GraphQLError('File upload failed');
                }

                const lowerCaseName = name.toLowerCase();
                const existing = await PlacementPartner.findOne({ name: lowerCaseName });

                if (existing) {
                    throw new GraphQLError('Placement partner already exists');
                }

                const logoUrl = await storageService.saveImage(upload, 'placement-partners');

                const partner = new PlacementPartner({
                    name: lowerCaseName,
                    logo: logoUrl
                });

                await partner.save();
                await redisClient.del(CACHE_KEYS.PLACEMENT_PARTNERS.ALL);
                return partner;
            } catch (error) {
                throw new GraphQLError(error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    }
};

export default resolvers;