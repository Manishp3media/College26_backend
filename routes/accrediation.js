import { addAccrediation, getAccrediation } from "../controllers/accrediation.js";
import express from "express";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// add accrediation
router.post("/add/accrediation", authMiddleware("admin"), addAccrediation);

// get accrediation
router.get("/get/accrediations", authMiddleware("admin"), getAccrediation);

export default router;