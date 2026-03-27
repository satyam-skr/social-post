import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from '../models/post.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import multer from "multer";

const parseBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return null;

    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    return null;
};

const populatePostUser = (postDocOrId) => {
    const id = postDocOrId?._id || postDocOrId;
    return Post.findById(id).populate("userId", "username firstName lastName avatar");
};


const createNormalPost = async (data) => {
    const {checks, valueOf} = data;
    const newPostData = {};
    if(checks.text){
        newPostData.text = valueOf.text;
    }
    if(checks.image){
        newPostData.imageUrls = valueOf.imageUrls;
    }
    newPostData.isComment = false;
    newPostData.userId = valueOf.userId;

    const newPost = await Post.create(newPostData);

    return newPost;
}

const createComment = async (data) => {
    const {checks, valueOf} = data;
    const newPostData = {};
    if(checks.text){
        newPostData.text = valueOf.text;
    }
    if(checks.image){
        newPostData.imageUrls = valueOf.imageUrls;
    }
    newPostData.isComment = true;
    newPostData.parentPostId = valueOf.parentPostId;

    newPostData.userId = valueOf.userId;

    const newPost = await Post.create(newPostData);

    return newPost;
}


const createPost = asyncHandler(async (req, res) => {
    const {
        text,
        isComment,
        parentPostId
    } = req.body;

    const checks = {};
    const valueOf = {};

    if (!text || text.trim() === "") {
        checks.text = false;
    }
    else {
        checks.text = true;
        valueOf.text = text.trim();
    }

    if (
        isComment === true ||
        (typeof isComment === "string" && isComment.trim().toLowerCase() === "true")
    ) {
        checks.isComment = true;
    }
    else {
        checks.isComment = false;
    }

    if (!parentPostId || String(parentPostId).trim() === "") {
        checks.parentPostId = false;
    }
    else {
        checks.parentPostId = true;
        valueOf.parentPostId = String(parentPostId).trim();
    }


    const photos = req.files || [];

    if (photos.length > 5) {
        throw new ApiError(400, "you can upload at max 5 images");
    }

    if (photos.length === 0) {
        checks.image = false;
    }
    else {
        checks.image = true;
        const uploadResults = await Promise.all(
            photos.map((file) => uploadOnCloudinary(file.path, "posts"))
        );
        const imageUrls = uploadResults
            .filter(Boolean)
            .map((result) => result.secure_url || result.url)
            .filter(Boolean);

        if (imageUrls.length === 0) {
            throw new ApiError(500, "failed to upload images");
        }

        valueOf.imageUrls = imageUrls;
    }

    valueOf.userId = req.user?._id || req.user?.id;

    if (!valueOf.userId) {
        throw new ApiError(401, "user context not found");
    }


    if(!checks.text && !checks.image){
        throw new ApiError(400, "either text or image or both is required to post something");
    }

    let data;

    if(checks.isComment){
        if (!checks.parentPostId) {
            throw new ApiError(400, "parentPostId is required for comments");
        }

        const parentPost = await Post.findById(valueOf.parentPostId);
        if (!parentPost) {
            throw new ApiError(404, "parent post not found");
        }

        data = await createComment({
            checks,
            valueOf
        });
    }

    else{
        data = await createNormalPost({
            checks,
            valueOf
        });
    }


    // Populate author on the freshly-created document.
    await data.populate("userId", "username firstName lastName avatar");
    const populatedPost = data;

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                post: populatedPost
            },
            "post created successfully"
        )
    );
});


const getFeed = asyncHandler(async (req, res) => {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 10;

    const isComment = parseBoolean(req.query.isComment);
    const parentPostId = req.query.parentPostId;

    // Default behavior: top-level feed posts only.
    const filter = {};
    if (isComment === null) {
        filter.isComment = false;
        filter.parentPostId = null;
    } else if (isComment === true) {
        if (!parentPostId) {
            throw new ApiError(400, "parentPostId is required to fetch comments");
        }
        filter.isComment = true;
        filter.parentPostId = parentPostId;
    } else {
        filter.isComment = false;
        filter.parentPostId = null;
    }

    const posts = await Post.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "username firstName lastName avatar");

    const total = await Post.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                data: posts
            },
            "posts fetched successfully"
        )
    );

})

const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!postId) {
        throw new ApiError(400, "postId is required");
    }

    const post = await populatePostUser(postId);
    if (!post) {
        throw new ApiError(404, "post not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            post,
            "post fetched successfully"
        )
    );
})


const deletePost = asyncHandler(async (req, res) =>{
    const { postId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!postId) {
        throw new ApiError(400, "postId is required");
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "post not found");
    }

    if (!userId || String(post.userId) !== String(userId)) {
        throw new ApiError(403, "you can only delete your own post");
    }

    if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
        await Promise.all(post.imageUrls.map((url) => deleteFromCloudinary(url)));
    }

    await Post.findByIdAndDelete(postId);
    await Post.deleteMany({ parentPostId: postId });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "post deleted successfully"));
})

const toggleLike = asyncHandler(async (req, res)=> {
    const { postId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!postId) {
        throw new ApiError(400, "postId is required");
    }

    if (!userId) {
        throw new ApiError(401, "user context not found");
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "post not found");
    }

    const alreadyLiked = post.likes.some((likedUserId) => String(likedUserId) === String(userId));

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        alreadyLiked
            ? { $pull: { likes: userId } }
            : { $addToSet: { likes: userId } },
        { new: true }
    ).populate("userId", "username firstName lastName avatar");

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                liked: !alreadyLiked,
                likesCount: updatedPost.likes.length,
                post: updatedPost
            },
            !alreadyLiked ? "post liked" : "post unliked"
        ));
})



export {
    createPost,
    getFeed,
    getPostById,
    deletePost,
    toggleLike
}