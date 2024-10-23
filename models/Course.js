import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        unique: true
    },
    courseShortName: {
        type: String,
        required: true,
        unique: true
    },
    duration: {
        type: Number,
        required: true
    },
    admissionOpen: {
        type: Boolean,
    },
    digitalLearningSupport: {
        type: Boolean
    },
    certificate: {
        type: String
    },
    eligibility: {
        type: String
    },
    courseType: {
        type: String,
        enum: ['fullTime', 'partTime']
    },
    academicLevel:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicLevel",
        required: true
    }
});

export default mongoose.model("Course", courseSchema);