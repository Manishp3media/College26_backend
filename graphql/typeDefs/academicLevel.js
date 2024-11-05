const typeDefs = `#graphql
    type AcademicLevel {
        _id: ID!
        name: String!
        streams: [ID!]
    }

    input AddAcademicLevelInput {
        name: String!
        streams: [ID!]
    }

    type Query {
        getAcademicLevels: [AcademicLevel]
    }

    type Mutation {
        addAcademicLevel(input: AddAcademicLevelInput!): AcademicLevel!
    }
`;

export default typeDefs;