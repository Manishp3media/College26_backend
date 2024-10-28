const typeDefs = `#graphql
    type AuthResponse {
        token: String!
    }
    
    input AdminInput {
        email: String!
        password: String!
    }

    type Mutation {
        adminSignin(input: AdminInput!): AuthResponse!
        adminSignup(input: AdminInput!): AuthResponse!
    }
`
export default typeDefs;