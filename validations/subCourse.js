import zod from "zod";

// Sub-course Validation
export const addSubCourseValidationSchema = zod.object({
    subCourseName: zod.string().min(1, "Sub-course name is required"),
    subCourseShortName: zod.string().min(1, "Sub-course short name is required"),
    subCourseDescription: zod.string().optional(),
    fees: zod.number("Fees is required"),
    course: zod.string().min(1, "Course is required"),
})