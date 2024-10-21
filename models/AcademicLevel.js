import mongoose from "mongoose";

const academicLevelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    stream: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stream",
        required: true
    }
});

export default mongoose.model("AcademicLevel", academicLevelSchema);