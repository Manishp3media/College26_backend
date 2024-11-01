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

// Fees virtual
universitySubCourseSchema.virtual("fees").get(function () {
    // If customFees exists, use it
    if (this.customFees !== null) {
        return this.customFees;
    }
    // Otherwise use subCourse fees if available
    return this.populated('subCourse') ? this.subCourse.fees : undefined;
});

universitySubCourseSchema.virtual("description").get(function () {
    // If customDescription exists, use it
    if (this.customDescription !== null) {
        return this.customDescription;
    }
    // Otherwise use subCourse description if available
    return this.populated('subCourse') ? this.subCourse.subCourseDescription : undefined;
});

universitySubCourseSchema.virtual('syllabus').get(function() {
    // If customSyllabus exists, use it
    if (this.customSyllabus !== null) {
        return this.customSyllabus;
    }
    // Otherwise use subCourse syllabus if available
    return this.populated('subCourse') ? this.subCourse.syllabus : undefined;
});

universitySubCourseSchema.virtual('banners').get(function() {
    // If customBanners exists and not empty, use them
    if (this.customBanners && this.customBanners.length > 0) {
        return this.customBanners;
    }
    // Otherwise use subCourse banners if available
    return this.populated('subCourse') ? this.subCourse.banners : undefined;
});

// Enable virtuals when converting to JSON
universitySubCourseSchema.set('toJSON', { virtuals: true });
universitySubCourseSchema.set('toObject', { virtuals: true });

export default mongoose.models.UniversitySubCourse || mongoose.model("UniversitySubCourse", universitySubCourseSchema);

// console.log('Virtual Getter Debug:', {
//     docId: this._id,
//     customFees: this.customFees,
//     subCourseFees: this.subCourse?.fees,
//     customFeesType: typeof this.customFees,
//     isCustomFeesNull: this.customFees === null,
//     isCustomFeesUndefined: this.customFees === undefined
// });