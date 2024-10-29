import zod from "zod";

export const accrediationValidationSchema = zod.object({
    name: zod.string().min(1, "Name is required"),
})