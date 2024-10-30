const typeDefs = `#graphql
    scalar Upload

    type Course {
        _id: ID!
        courseName: String!
        courseShortName: String!
        duration: Int!
        admissionOpen: Boolean!
        digitalLearningSupport: Boolean!
        certificate: String
        eligibility: String
        courseType: String!
        academicLevel: String!
        stream: String!
    }

    type Query {
        getCourses: [Course]
    }

    type Mutation {
    addCourse(
      courseName: String!
      courseShortName: String!
      duration: Int!
      certificate: Upload!
      eligibility: String!
      courseType: String!
      academicLevel: String!
      stream: String!
      admissionOpen: Boolean!
      digitalLearningSupport: Boolean!
    ): Course!

    updateCourse(
            id: ID!
            courseName: String
            courseShortName: String
            duration: Int
            certificate: Upload
            eligibility: String
            courseType: String
            academicLevel: String
            stream: String
            admissionOpen: Boolean
            digitalLearningSupport: Boolean
        ): Course!

    deleteCourse(id: ID!): Course!
  }
`;

export default typeDefs;

