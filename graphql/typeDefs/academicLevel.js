const typeDefs = `#graphql
    type AcademicLevel {
        _id: ID!
        name: String!
    }

    input AddAcademicLevelInput {
        name: String!
    }

    type Query {
        getAcademicLevels: [AcademicLevel]
    }

    type Mutation {
        addAcademicLevel(input: AddAcademicLevelInput!): AcademicLevel!
    }
`;

export default typeDefs;