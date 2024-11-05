const typeDefs = `#graphql
scalar Upload

type University {
    _id: ID!
    universityName: String!
    universityShortName: String!
    universityLink: String
    universityLogo: String
    banners: [Banner]
    brochure: String
    tagLine: String
    accrediations: [String]
    examinationPattern: ExaminationPattern
    admissionProcess: AdmissionProcess
    placementPartners: [String]
    socialMediaLinks: [String]
    amenities: [String]
    about: About
}

type About {
    heading: String
    description: String
}

type Banner {
    _id: ID
    url: String
}

type AdmissionProcess {
    description: String
    steps: [AdmissionStep]
}

type AdmissionStep {
    stepNumber: Int!
    stepDescription: String!
}

type ExaminationPattern {
    description: String
    document: String
}

type Query {
    getUniversity(id: ID!): University
    getAllUniversities: [University]
}

type Mutation {
    addUniversity(input: AddUniversityInput!): University!
    updateUniversity(id: ID!, input: UpdateUniversityInput!): University!
    deleteUniversity(id: ID!): University!
}

input AddUniversityInput {
    universityName: String!
    universityShortName: String!
    universityLink: String
    universityLogo: Upload
    tagLine: String
    brochure: Upload
    accrediations: [String]
    admissionProcess: AdmissionProcessInput
    examinationPattern: ExaminationPatternInput
    universitySubCourses: [AddUniversitySubCourseInput]
    placementPartners: [String]
    socialMediaLinks: [String]
    amenities: [String]
    banners: [Upload]
    about: AboutInput
}

input UpdateUniversityInput {
    universityName: String
    universityShortName: String
    universityLink: String
    universityLogo: String
    tagLine: String
    brochure: String
    accrediations: [ID]
    admissionProcess: AdmissionProcessInput
    examinationPattern: ExaminationPatternInput
    placementPartners: [ID]
    socialMediaLinks: [ID]
    amenities: [ID]
    banners: [Upload]
}

input BannerInput {
    url: String
}

input AdmissionProcessInput {
    description: String
    steps: [AdmissionStepInput]
}

input AdmissionStepInput {
    stepNumber: Int!
    stepDescription: String!
}

input AboutInput {
    heading: String
    description: String
}

input ExaminationPatternInput {
    description: String
    document: Upload
}

input AddUniversitySubCourseInput {
    subCourseId: ID
    customFees: Int
    customDescription: String
    customSyllabus: Upload
    customBanners: [BannerInput]
}
`;

export default typeDefs;