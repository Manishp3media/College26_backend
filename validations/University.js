import zod from "zod";
import z from "zod";

const aboutSchema = zod.object({
    heading: zod.string().min(1, "Heading is required").optional(),
    description: zod.string().min(1, "Description is required").optional()
});

const addmissionSchema = zod.object({
    description: zod.string().optional(),
    steps: zod.array(zod.object({
        stepNumber: zod.number().optional(),
        stepDescription: zod.string().optional()
    }))
})

// Schema for custom subcourse data
const universitySubCourseSchema = z.union([
    // Option 1: Just a string ID
    z.string(),
    
    // Option 2: Object with custom data
    z.object({
        subCourseId: z.string(),
        customFees: z.number().positive().optional(),
        customDescription: z.string().min(1).optional(),
        // customSyllabus: z.string().min(1).optional(),
        // customBanners: z.array(
        //     z.object({
        //         id: z.string(),
        //         url: z.string().url()
        //     })
        // ).optional()
    })
]);

export const addUniversityValidationSchema = zod.object({
    universityName: zod.string().min(1, "University name is required"),
    universityShortName: zod.string().min(1, "University short name is required"),
    universityLogo: zod.string().optional(),
    tagLine: zod.string().min(1, "Tag line is required"),
    universityLink: zod.string().optional(),
    brochure: zod.string().optional(),
    // banners: zod.array(zod.object({
    //     id: zod.string().min(1, "Banner ID is required"), // Changed to required
    //     url: zod.string().min(1, "Banner URL is required"), // Changed to required
    // })).optional(),
    about: aboutSchema.optional(), // Ensure aboutSchema is defined
    accrediations: zod.array(zod.string()).min(1, "At least one accreditation is required"),
    universitySubCourses: z.array(universitySubCourseSchema)
        .min(1, "At least one sub-course is required"),
    admissionProcess: addmissionSchema.optional(), // Ensure addmissionSchema is defined
    placementPartners: zod.array(zod.string()).min(1, "At least one placement partner is required"),
    socialMediaLinks: zod.array(zod.string()).min(1, "At least one social media link is required"),
    amenities: zod.array(zod.string()).min(1, "At least one amenity is required"),
});