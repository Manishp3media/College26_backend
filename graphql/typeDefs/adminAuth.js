

const typeDefs = `#graphql
directive @auth(
    roles: [String]
    public: Boolean = false
) on FIELD_DEFINITION

    type AuthResponse {
        token: String!
    }
    
    input AdminInput {
        email: String!
        password: String!
    }

    type Mutation {
        adminSignin(input: AdminInput!): AuthResponse! @auth(public: true)
        adminSignup(input: AdminInput!): AuthResponse! @auth(public: true)
    }
`
export default typeDefs;