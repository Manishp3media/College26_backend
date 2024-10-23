import zod from "zod";

export const addSocialMediaValidationShema = zod.object({
    name: zod.string().min(1, "Name is required"),
    url: zod.string().min(1, "URL is required"),
})