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
        id: { type: String}, 
        url: { 
          type: String, 
          default: "https://foundr.com/wp-content/uploads/2021/09/Best-online-course-platforms.png" 
        }
      }
    ],
    subCourseDescription: {
      type: String,
      default: function() {
        return `Welcome to the course '${this.subCourseName}', designed for learners who are eager to expand their knowledge and skills in this vital area. This comprehensive program covers a wide range of topics, including foundational concepts, practical applications, and advanced strategies. 
  
        Throughout the course, you will engage in interactive lessons, hands-on projects, and real-world case studies that will enhance your learning experience. Our expert instructors are dedicated to providing personalized support and guidance, ensuring that you not only grasp the material but also apply it effectively in your own context. 
  
        Whether you are a beginner looking to start your journey or an experienced professional aiming to refine your expertise, this course is tailored to meet your needs. Join us in exploring the intricacies of '${this.subCourseName}' and take the first step towards mastering this important field!`;
      }
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