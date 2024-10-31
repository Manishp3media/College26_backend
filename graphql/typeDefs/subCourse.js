const typeDefs = `#graphql
    scalar Upload

    type SubCourse {
        _id: ID!
        subCourseName: String!
        subCourseShortName: String!
        subCourseDescription: String
        fees: Int!
        course: String
        syllabus: String
        banners: [Banner]
    }

    type Banner {
        _id: ID
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

    input UpdateSubCourseInput {
        id: ID
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

        updateSubCourse(input: UpdateSubCourseInput!): SubCourse!

        deleteSubCourse(id: ID!): SubCourse!
    }
`;

export default typeDefs;