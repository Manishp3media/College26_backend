import streamTypeDefs from './stream.js';

const typeDefs = `#graphql
    type AcademicLevel {
        _id: ID!
        name: String!
       streams: [Stream]
    }

    ${streamTypeDefs}

    input AddAcademicLevelInput {
        name: String!
        streams: [String]
    }

    type Query {
        getAcademicLevels: [AcademicLevel]
    }

    type Mutation {
        addAcademicLevel(input: AddAcademicLevelInput!): AcademicLevel!
    }
`;

export default typeDefs;