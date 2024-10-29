import zod from "zod";

export const addStreamValidationSchema = zod.object({
    name: zod.string().min(1, "Name is required"),
});