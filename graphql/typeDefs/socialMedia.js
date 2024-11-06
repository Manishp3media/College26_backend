const typeDefs = `#graphql
    scalar Upload

    type SocialMedia {
        _id: ID!
        name: String!
        url: String!
    }

    input AddSocialMediaInput {
        name: String!
        url: Upload!
    }

    type Query {
        getSocialMedias: [SocialMedia]
    }

    type Mutation {
        addSocialMedia(input: AddSocialMediaInput!): SocialMedia!
    }
`;

export default typeDefs;