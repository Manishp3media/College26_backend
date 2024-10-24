import zod from "zod";

export const addCourseValidationShema = zod.object({
    courseName: zod.string().min(1, "Course name is required"),
    courseShortName: zod.string().min(1, "Course short name is required"),
    duration: zod.string().min(1, "Duration is required"),
    admissionOpen: zod.boolean("Admission Open is required"),
    digitalLearningSupport: zod.boolean("Digital Learning Support is required"),
    certificate: zod.string().optional(),
    eligibility: zod.string().optional(),
    courseType: zod.string().min(1, "Course type is required"),
    academicLevel: zod.array(zod.string()).min(1, "At least one academic level is required"),
})