import zod from "zod";

export const accrediationValidationShema = zod.object({
    name: zod.string().min(1, "Name is required"),
    // TODO: Add logo
    // logo: zod.string().min(1, "Logo is required"),
})