import mongoose from "mongoose";

const academicLevelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});

export default mongoose.model("AcademicLevel", academicLevelSchema);
