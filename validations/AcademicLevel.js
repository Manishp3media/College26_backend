import zod from "zod";

export const addAcademicLevelValidationShema = zod.object({
    name: zod.string().min(1, "Name is required"),
    streams: zod.array(zod.string()).min(1, "At least one stream is required") // 
})