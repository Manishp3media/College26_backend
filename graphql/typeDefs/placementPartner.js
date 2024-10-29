const typeDefs = `#graphql
    scalar Upload

    type PlacementPartner {
        _id: ID!
        name: String!
        logo: String!
    }

    type Query {
        getPlacementPartners: [PlacementPartner]
    }

    type Mutation {
        addPlacementPartner(name: String!, logo: Upload!): PlacementPartner!
    }
`;

export default typeDefs;