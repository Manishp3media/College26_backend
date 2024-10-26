import zod from "zod";

// Validation schema for updating university sub course
export const updateUniversitySubCourseSchema = z.object({
    customFees: z.number().optional(),
    customDescription: z.string().optional(),
    // customSyllabus: z.string().optional(),
    // customBanners: z.array(z.object({
    //     id: z.string(),
    //     url: z.string()
    // })).optional()
});