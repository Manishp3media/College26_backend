import mongoose from "mongoose"

const subCourseSchema = new mongoose.Schema({
    subCourseName: {
        type: String,
        required: true,
        unique: true
    },
    subCourseShortName: {
        type: String,
        required: true,
        unique: true
    },
    banners: [
        {
          id: { type: String, required: true }, 
          url: { type: String, required: true }
        }
      ],
      subCourseDescription: {
        type: String,
      },
      syllabus: {
        type: String
      },
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
      },
      fees: {
        type: Number
      },
});

export default mongoose.model("SubCourse", subCourseSchema);