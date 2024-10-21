import zod from "zod";

// Signup Validation
export const userSignupShema = zod.object({
    fullName: zod.string().min(1, "Name is required"),
    mobileNumber: zod.string().min(1, "Mobile number is required"),
    email: zod.string().email("Invalid email address"),
    gender: zod.string().min(1, "Gender is required"),
    dob: zod.string().refine((dateString) => !isNaN(Date.parse(dateString)), {
        message: "Invalid date format",
    }).transform((dateString) => new Date(dateString)).optional(),    
    country: zod.string().min(1, "Country is required"),
    state: zod.string().min(1, "State is required"),
    city: zod.string().min(1, "City is required"),
    qualification: zod.string().min(1, "Qualification is required"),
     // TODO: Add sub-course
    // subCourse: zod.string().min(1, "Sub-course is required"),
});

// Signin Validation
export const userSigninShema = zod.object({
    mobileNumber: zod
  .string()
  .min(10, "Mobile number must be 10 digits")
  .max(10, "Mobile number must be 10 digits"),

});

// Admin Validation
export const adminValidationShema = zod.object({
    email: zod.string().email("Invalid email address"),
    password: zod.string().min(6, "Password is required"),
});

