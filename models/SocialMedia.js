import mongoose from "mongoose";

const SocialMediaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    url: {
        type: String,
        required: true
    }
});

export default mongoose.model("SocialMedia", SocialMediaSchema);