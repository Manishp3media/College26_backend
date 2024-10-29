import { addSocialMediaValidationSchema } from "../../validations/socialMedia.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";
import SocialMedia from "../../models/SocialMedia.js";
import { GraphQLError } from "graphql";

const resolvers = {
    Query: {
      getSocialMedias: async (_, __, { redisClient, isAdmin }) => {
        try {
          // Check authentication
          if (!isAdmin) {
            throw new GraphQLError('Not authorized', {
              extensions: { code: 'UNAUTHORIZED' },
            });
          }
  
          // Check cache
          const cachedSocialMedia = await redisClient.get(CACHE_KEYS.SOCIAL_MEDIA.ALL);
          if (cachedSocialMedia) {
            return JSON.parse(cachedSocialMedia);
          }
  
          const socialMedias = await SocialMedia.find();
  
          // Set cache
          await redisClient.setEx(
            CACHE_KEYS.SOCIAL_MEDIA.ALL,
            CACHE_TTL.MEDIUM,
            JSON.stringify(socialMedias)
          );
  
          return socialMedias;
        } catch (error) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }
      },
    },
  
    Mutation: {
        addSocialMedia: async (_, { input }, { redisClient, isAdmin }) => {
        try {
          // Check authentication
          if (!isAdmin) {
            throw new GraphQLError('Not authorized', {
              extensions: { code: 'UNAUTHORIZED' },
            });
          }
  
          // Validate input
          const validation = addSocialMediaValidationSchema.safeParse(input);
          if (!validation.success) {
            throw new GraphQLError('Invalid input', {
              extensions: {
                code: 'BAD_USER_INPUT',
                errors: validation.error.flatten().fieldErrors,
              },
            });
          }
  
          const { name, url } = input;
          const lowerCaseName = name.toLowerCase();
  
          // Check if social media exists
          const existingSocialMedia = await SocialMedia.findOne({ name: lowerCaseName });
          if (existingSocialMedia) {
            throw new GraphQLError('Social media already exists', {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }
  
          // Create new social media
          const newSocialMedia = new SocialMedia({ name: lowerCaseName, url });
          await newSocialMedia.save();
  
          // Invalidate cache
          await redisClient.del(CACHE_KEYS.SOCIAL_MEDIA.ALL);
  
          return newSocialMedia;
        } catch (error) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }
      },
    },
  };
  
  export default resolvers;
  