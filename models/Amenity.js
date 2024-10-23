import mongoose from "mongoose";

const amenitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    iconName: {
        type: String,
        required: true
    }
});

export default mongoose.model("Amenity", amenitySchema);