const typeDefs = `#graphql
    scalar Upload

    type SubCourse {
        _id: ID!
        subCourseName: String!
        subCourseShortName: String!
        subCourseDescription: String
        fees: Int!
        course: String
        syllabus: Upload
        banners: [Banner]
    }

    type Banner {
        id: ID
        url: String
    }

    input AddSubCourseInput {
        subCourseName: String!
        subCourseShortName: String!
        subCourseDescription: String
        fees: Int!
        course: String
        syllabus: Upload
        banners: [Upload]
    } 

    type Query {
        getSubCourses: [SubCourse]
    }

    type Mutation {
        addSubCourse(input: AddSubCourseInput!): SubCourse!
    }
`;

export default typeDefs;