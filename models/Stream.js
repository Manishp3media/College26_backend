import mongoose from "mongoose";

const streamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});

export default mongoose.model("Stream", streamSchema);