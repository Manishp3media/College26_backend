const typeDefs = `#graphql
    type Amenity {
        _id: ID
        name: String
        iconName: String
    }

    input AddAmenityInput {
        name: String!
        iconName: String!
    }

    type Query {
        getAmenities: [Amenity]
    }

    type Mutation {
        addAmenity(input: AddAmenityInput!): Amenity!
    }
`;

export default typeDefs;