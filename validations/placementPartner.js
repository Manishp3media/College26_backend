import zod from "zod";

export const addPlacementPartnerValidationSchema = zod.object({
    name: zod.string().min(1, "Name is required")
})