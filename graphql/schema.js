import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import authTypeDefs from '../graphql/typeDefs/auth.js';
import authResolvers from '../graphql/resolvers/auth.js';
import amenityTypeDefs from '../graphql/typeDefs/amenity.js';
import amenityResolvers from '../graphql/resolvers/amenity.js';
import adminTypeDefs from '../graphql/typeDefs/adminAuth.js';
import adminResolvers from '../graphql/resolvers/adminAuth.js';
import placementPartnerTypeDefs from '../graphql/typeDefs/placementPartner.js';
import placementPartnerResolvers from '../graphql/resolvers/placementPartner.js';
import accrediationTypeDefs from '../graphql/typeDefs/accrediation.js';
import accrediationResolvers from '../graphql/resolvers/accrediations.js';
import socialMediaTypeDefs from '../graphql/typeDefs/socialMedia.js';
import socialMediaResolvers from '../graphql/resolvers/socialMedia.js';
import streamTypeDefs from '../graphql/typeDefs/stream.js';
import streamResolvers from '../graphql/resolvers/stream.js';
import academicLevelResolvers from '../graphql/resolvers/academicLevel.js';
import academicLevelTypeDefs from '../graphql/typeDefs/academicLevel.js';

// Merge all type definitions and resolvers
const typeDefs = mergeTypeDefs([
    authTypeDefs,
    adminTypeDefs,
    amenityTypeDefs,
    placementPartnerTypeDefs,
    accrediationTypeDefs,
    socialMediaTypeDefs,
    streamTypeDefs,
    academicLevelTypeDefs
]);

const resolvers = mergeResolvers([
    authResolvers,
    adminResolvers,
    amenityResolvers,
    placementPartnerResolvers,
    accrediationResolvers,
    socialMediaResolvers,
    streamResolvers,
    academicLevelResolvers
]);

export { typeDefs, resolvers };