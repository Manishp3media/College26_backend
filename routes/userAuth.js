import { userSignin, userSignup } from "../controllers/userAuth.js";
import express from "express";

const router = express.Router();

// User Signup
router.post("/user/signup", userSignup);

// User Signin
router.post("/user/signin", userSignin);

export default router;