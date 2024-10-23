import { addPlacementPartner, getPlacementPartner } from "../controllers/placementPartner.js";
import express from "express";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// add placement partner
router.post("/add/placementpartner", authMiddleware("admin"), addPlacementPartner);

// get placement partner
router.get("/get/placementpartners", authMiddleware("admin"), getPlacementPartner);

export default router;