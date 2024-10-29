const typeDefs = `#graphql
    scalar Upload

    type Accrediation {
        _id: ID!
        name: String!
        logo: String!
    }

    input AddAccrediationInput {
        name: String!
        logo: Upload!
    }

    type Query {
        getAccrediations: [Accrediation]
    }

    type Mutation {
        addAccrediation(input: AddAccrediationInput!): Accrediation!
    }
`;

export default typeDefs;