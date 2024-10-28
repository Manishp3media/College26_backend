import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import authTypeDefs from '../graphql/typeDefs/auth.js';
import authResolvers from '../graphql/resolvers/auth.js';
import amenityTypeDefs from '../graphql/typeDefs/amenity.js';
import amenityResolvers from '../graphql/resolvers/amenity.js';
import adminTypeDefs from '../graphql/typeDefs/adminAuth.js';
import adminResolvers from '../graphql/resolvers/adminAuth.js';

// Merge all type definitions and resolvers
const typeDefs = mergeTypeDefs([
    authTypeDefs,
    adminTypeDefs,
    amenityTypeDefs,
]);

const resolvers = mergeResolvers([
    authResolvers,
    adminResolvers,
    amenityResolvers
]);

export { typeDefs, resolvers };