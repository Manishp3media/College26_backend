import { GraphQLError } from "graphql";
import Amenity from "../../models/Amenity.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";
import { addAmenityValidationShema } from "../../validations/amenity.js";

const resolvers = {
  Query: {
    getAmenities: async (_, __, { redisClient, isAdmin }) => {
      try {
        // Check authentication
        if (!isAdmin) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        // Check cache
        const cachedAmenities = await redisClient.get(CACHE_KEYS.AMENITIES.ALL);
        if (cachedAmenities) {
          return JSON.parse(cachedAmenities);
        }

        const amenities = await Amenity.find();

        // Set cache
        await redisClient.setEx(
          CACHE_KEYS.AMENITIES.ALL,
          CACHE_TTL.MEDIUM,
          JSON.stringify(amenities)
        );

        return amenities;
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Not required for now
    // amenity: async (_, { id }) => {
    //   try {
    //     const amenity = await Amenity.findById(id);
    //     if (!amenity) {
    //       throw new GraphQLError('Amenity not found', {
    //         extensions: { code: 'NOT_FOUND' },
    //       });
    //     }
    //     return amenity;
    //   } catch (error) {
    //     throw new GraphQLError(error.message, {
    //       extensions: { code: 'INTERNAL_SERVER_ERROR' },
    //     });
    //   }
    // },
  },

  Mutation: {
    addAmenity: async (_, { input }, { redisClient, isAdmin }) => {
      try {
        // Check authentication
        if (!isAdmin) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        // Validate input
        const validation = addAmenityValidationShema.safeParse(input);
        if (!validation.success) {
          throw new GraphQLError('Invalid input', {
            extensions: {
              code: 'BAD_USER_INPUT',
              errors: validation.error.flatten().fieldErrors,
            },
          });
        }

        const { name, iconName } = input;
        const lowerCaseName = name.toLowerCase();

        // Check if amenity exists
        const existingAmenity = await Amenity.findOne({ name: lowerCaseName });
        if (existingAmenity) {
          throw new GraphQLError('Amenity already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Create new amenity
        const newAmenity = new Amenity({ name: lowerCaseName, iconName });
        await newAmenity.save();

        // Invalidate cache
        await redisClient.del(CACHE_KEYS.AMENITIES.ALL);

        return newAmenity;
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
};

export default resolvers;
