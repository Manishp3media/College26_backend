import { addStreamValidationSchema } from "../../validations/stream.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";
import { GraphQLError } from "graphql";
import Stream from "../../models/Stream.js";

const resolvers = {
    Query: {
        getStreams: async (_, __, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }
                // Use the constant cache key
                const cachedStreams = await redisClient.get(CACHE_KEYS.STREAMS.ALL);

                if (cachedStreams) {
                    return JSON.parse(cachedStreams);
                }

                // get all streams from mongodb
                const streams = await Stream.find();

                // Use the constant TTL
                await redisClient.setEx(
                    CACHE_KEYS.STREAMS.ALL,
                    CACHE_TTL.LONG, // 1 hour cache
                    JSON.stringify(streams)
                );

                return streams;
            } catch (err) {
                throw new GraphQLError(err.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    },

    Mutation: {
        addStream: async (_, { input }, { redisClient, isAdmin }) => {
            try {
                // Check authentication
                if (!isAdmin) {
                    throw new GraphQLError('Not authorized', {
                        extensions: { code: 'UNAUTHORIZED' },
                    });
                }

                // Validate input
                const validation = addStreamValidationSchema.safeParse(input);
                if (!validation.success) {
                    throw new GraphQLError('Invalid input', {
                        extensions: {
                            code: 'BAD_USER_INPUT',
                            errors: validation.error.flatten().fieldErrors,
                        },
                    });
                }

                // Convert name to lowercase
                const lowerCaseName = input.name.toLowerCase();

                // Check if the name already exists
                const existingStream = await Stream.findOne({ name: lowerCaseName });
                if (existingStream) {
                    throw new GraphQLError('Stream already exists', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Create new Stream
                const newStream = new Stream({ name: lowerCaseName });
                await newStream.save();

                // Invalidate the streams cache
                await redisClient.del(CACHE_KEYS.STREAMS.ALL);

                return newStream;
            } catch (err) {
                throw new GraphQLError(err.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },
    },
}       

export default resolvers;