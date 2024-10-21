import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    // For MR: mobileNumber is required and unique
    mobileNumber: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return this.role === 'user' ? !!v : true;
            },
            message: 'Mobile number is required for users'
        }
    },
    // For Admin: email is required and unique
    email: {
        type: String,
        unique: true,
        sparse: true,
        required: true,
    },
    gender: {
        type: String,
    },
    dob: {
        type: Date
    },
    country: {
        type: String
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    qualitifcation: {
        type: String
    },
     // TODO: Add sub-course
    // subCourse: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'SubCourse'
    // },
    password: {
        type: String,
    },
    // selectedCourses: {
    //     type: [mongoose.Schema.Types.ObjectId],
    //     ref: 'SubCourse'
    // },
    // appliedCourses: {
    //     type: [mongoose.Schema.Types.ObjectId],
    //     ref: 'SubCourse'
    // },
    role: {
        type: String,
        enum: ['admin', 'user'],
        required: true
    },
    
});

export default mongoose.model('User', userSchema);