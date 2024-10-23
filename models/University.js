import mongoose from "mongoose";

const universitySchema = new mongoose.Schema({
    universityName: {
        type: String,
        required: true,
        unique: true
    },
    universityShortName: {
        type: String,
        required: true,
        unique: true
    },
    universityLogo: {
        type: String,
    },
    tagLine: {
        type: String,
        required: true
    },
    banners: [
        {
            id: { type: String, required: true },
            url: { type: String, required: true }
        }
    ],
    universityLink: {
        type: String
    },
    brochure: {
        type: String
    },
    about: {
        heading: {
            type: String,
            default: function () {
                return `About ${this.universityName}`;
            }
        },
        description: {
            type: String,
            default: function () {
                return `${this.universityName} university is dedicated to providing a high-quality education that fosters academic excellence, innovation, and personal growth. With a rich history and a commitment to shaping the leaders of tomorrow, the university offers a wide range of undergraduate, postgraduate, and professional programs designed to prepare students for success in their chosen fields.
                The campus provides state-of-the-art facilities, experienced faculty, and a vibrant community where students can engage in diverse activities, research opportunities, and extracurricular programs. Whether you're interested in arts, sciences, technology, or business, ${this.universityName} is committed to helping you achieve your academic and professional goals in a dynamic and supportive environment.`;
            }
        }
    },
    accreditations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Accrediation",
    }],
    universitySubCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UniversitySubCourse",
        required: true
    }],
    admissionProcess: {
        description: {
            type: String,
            default: function () {
                return `In ${this.universityName}, the admission process takes place online. Fresh admission starts from January every year. There are direct admissions, and no entrance exam is conducted for the admission process. The admission procedure for this year is as follows:`;
            }
        },
        steps: {
            type: [
                {
                    stepNumber: {
                        type: Number,
                        required: true
                    },
                    stepDescription: {
                        type: String,
                        required: true
                    }
                }
            ],
            default: function () {
                return [
                    { stepNumber: 1, stepDescription: `Step 1: Register on ${this.universityName}'s admission portal.` },
                    { stepNumber: 2, stepDescription: "Step 2: Fill in the required personal and academic details." },
                    { stepNumber: 3, stepDescription: "Step 3: Upload the necessary documents." },
                    { stepNumber: 4, stepDescription: "Step 4: Pay the admission fee online." },
                    { stepNumber: 5, stepDescription: "Step 5: Confirm your admission by receiving the confirmation email." }
                ];
            }
        }
    },
    examinationPattern: {
        description: {
            type: String,
            default: function () {
                return `The examination pattern at ${this.universityName} is conducted in a semester-based system. Each semester includes midterm and final exams, with practical assessments where applicable. The exams focus on both theoretical knowledge and practical skills, and students are evaluated through written exams, practicals, assignments, and projects. Regular assessments help track student progress throughout the academic year.`;
            },
        },
        document: {
            type: String,
        }
    },
    placementPartners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlacementParnter",
    }],
    SocialMedias: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SocialMedia",
    }],
    amenities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Amenity",
    }],
});

export default mongoose.model("University", universitySchema);