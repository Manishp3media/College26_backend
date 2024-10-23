import mongoose from "mongoose";

const placementPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    logo: {
        type: String,
    },
});

export default mongoose.model("PlacementPartner", placementPartnerSchema);