import zod from "zod";

export const addAmenityValidationShema = zod.object({
    name: zod.string().min(1, "Name is required"),
    iconName: zod.string().min(1, "Icon name is required"),
})