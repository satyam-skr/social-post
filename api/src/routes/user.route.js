import { Router } from "express";
import {
    signupUser,
    loginUser,
    logoutUser,
    getProfile,
    getUserPosts,
    updateProfile,
    getCurrentUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.route("/signup").post(upload.single("avatar"), signupUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/me/update").patch(verifyJWT, updateProfile);
router.route("/:username/profile").get(getProfile);
router.route("/:userId/posts").get(getUserPosts);


export default router;