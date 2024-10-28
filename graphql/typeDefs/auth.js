const typeDefs = `#graphql
  enum Role {
    admin 
    user
  }

  type User {
    id: ID!
    fullName: String
    email: String!
    mobileNumber: String
    gender: String
    dob: String
    country: String
    state: String
    city: String
    qualification: String
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  input SignupInput {
    fullName: String!
    mobileNumber: String!
    email: String!
    gender: String!
    dob: String!
    country: String!
    state: String!
    city: String!
    qualification: String!
  }

  input SigninInput {
    mobileNumber: String!
  }

  type Mutation {
    signup(input: SignupInput!): AuthResponse!
    signin(input: SigninInput!): AuthResponse!
  }
`;

export default typeDefs;