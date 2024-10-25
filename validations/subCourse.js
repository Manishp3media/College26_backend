import zod from "zod";

// Sub-course Validation
export const addSubCourseValidationShema = zod.object({
    subCourseName: zod.string().min(1, "Sub-course name is required"),
    subCourseShortName: zod.string().min(1, "Sub-course short name is required"),
    // banners: zod.array(zod.object({
    //     id: zod.string().optional(),
    // })),
    subCourseDescription: zod.string().optional(),
    syllabus: zod.string().optional(),
    fees: zod.number("Fees is required"),
    course: zod.string().min(1, "Course is required"),
})