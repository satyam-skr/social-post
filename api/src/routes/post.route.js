import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    createPost,
    getFeed,
    getPostById,
    deletePost,
    toggleLike
} from '../controllers/post.controller.js';


const router = Router();


router.route("/create").post(verifyJWT, upload.array('photos', 5), createPost);
router.route("/all").get(getFeed);
router.route("/:postId").get(getPostById).delete(verifyJWT, deletePost);
router.route("/:postId/like").patch(verifyJWT, toggleLike);


export default router;