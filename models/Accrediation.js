import mongoose from "mongoose";

const accrediationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    logo: {
        type: String,
    }
});

export default mongoose.model("Accrediation", accrediationSchema);