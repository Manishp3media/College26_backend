const typeDefs = `#graphql
    type Stream {
        _id: ID!
        name: String!
    }

    input AddStreamInput {
        name: String!
    }

    type Query {
        getStreams: [Stream]
    }

    type Mutation {
        addStream(input: AddStreamInput!): Stream!  
    }
`;

export default typeDefs;