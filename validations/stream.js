import zod from "zod";

export const addStreamValidationShema = zod.object({
    name: zod.string().min(1, "Name is required"),
});