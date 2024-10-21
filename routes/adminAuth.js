import express from "express";
import { adminLogin, createAdmin } from "../controllers/adminAuth.js";

const router = express.Router();

// Admin Login
router.post("/admin/signin", adminLogin);

// Create Admin
router.post("/admin/create", createAdmin);

export default router