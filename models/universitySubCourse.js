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
        default: null  // Changed from undefined to null for better MongoDB handling
    },
    customDescription: {
        type: String,
        default: null
    },
    customSyllabus: {
        type: String,
        default: null
    },
    customName: {
        type: String,
        default: null
    },
    customShortName: {
        type: String,
        default: null
    },
    customBanners: [{
        id: { type: String },
        url: { type: String }
    }]
});

// Fixed the typo in the fees virtual getter
universitySubCourseSchema.virtual("fees").get(function () {
    console.log('Virtual Getter Debug:', {
        docId: this._id,
        customFees: this.customFees,
        subCourseFees: this.subCourse?.fees,
        customFeesType: typeof this.customFees,
        isCustomFeesNull: this.customFees === null,
        isCustomFeesUndefined: this.customFees === undefined
    });
    return this.customFees !== null ? this.customFees : this.subCourse?.fees;
});

universitySubCourseSchema.virtual("description").get(function () {
    console.log(`Custom Description for ${this._id}:`, this.customDescription);
    return this.customDescription !== null ? this.customDescription : this.subCourse?.description;
});

universitySubCourseSchema.virtual('syllabus').get(function() {
    return this.customSyllabus !== null ? this.customSyllabus : this.subCourse?.syllabus;
});

universitySubCourseSchema.virtual('banners').get(function() {
    return this.customBanners?.length > 0 ? this.customBanners : this.subCourse?.banners;
});

// Enable virtuals when converting to JSON
universitySubCourseSchema.set('toJSON', { virtuals: true });
universitySubCourseSchema.set('toObject', { virtuals: true });

export default mongoose.models.UniversitySubCourse || mongoose.model("UniversitySubCourse", universitySubCourseSchema);