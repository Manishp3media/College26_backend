import mongoose from "mongoose";

const universitySubCourseSchema = new mongoose.Schema({
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "University",
        required: true
    },
    subCourse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCourse",
        required: true
    },
    // Customizable fields with getters that fall back to SubCourse values
    customFees: {
        type: Number,
        default: undefined
    },
    customDescription: {
        type: String,
        default: undefined
    },
    customSyllabus: {
        type: String,
        default: undefined
    },
    customBanners: [{
        id: { type: String },
        url: { type: String }
    }]
});

// Virtual getters to handle fallback to SubCourse values
universitySubCourseSchema.virtual("fees").get(function () {
    return this.customFess !== undefined ? this.customFees : this.subCourse.fees;
});

universitySubCourseSchema.virtual("description").get(function () {
    return this.customDescription !== undefined ? this.customDescription : this.subCourse.description;
});


universitySubCourseSchema.virtual('syllabus').get(function() {
    return this.customSyllabus !== undefined ? this.customSyllabus : this.subCourse?.syllabus;
});

universitySubCourseSchema.virtual('banners').get(function() {
    return this.customBanners?.length > 0 ? this.customBanners : this.subCourse?.banners;
});

// Enable virtuals when converting to JSON
universitySubCourseSchema.set('toJSON', { virtuals: true });
universitySubCourseSchema.set('toObject', { virtuals: true });

export default mongoose.model("UniversitySubCourse", universitySubCourseSchema);