const typeDefs = `graphql
    type Course {
        _id: ID!
        courseName: String!
        courseShortName: String!
        duration: Int!
        admissionOpen: Boolean!
        digitalLearningSupport: Boolean!
        certificate: String
        eligibility: String
        courseType: String
        academicLevel: String
    }

    input AddCourseInput {
        courseName: String!
        courseShortName: String!
        duration: Int!
        admissionOpen: Boolean! 
        digitalLearningSupport: Boolean!
        certificate: String
        eligibility: String
        courseType: String
        academicLevel: String
    }

    type Query {
        getCourses: [Course]
    }

    type Mutation {
        addCourse(input: AddCourseInput!): Course!}
    }`