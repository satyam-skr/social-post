import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";

function isValidEmail(email) {
    if (typeof email !== 'string') {
        return false;
    }

    email = email.trim();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return emailRegex.test(email);
}


const signupUser = asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        username,
        email,
        password
    } = req.body;

    if (!firstName || !username || !email || !password) {
        throw new ApiError(400, "firstName username email and password are required.");
    }

    if(!isValidEmail(email)){
        throw new ApiError(400, "enter a valid email");
    }
    
    const existingUser = await User.find({
        $or: [{email}, {username}]
    });

    if(existingUser.length > 0){
        throw new ApiError(400, "user with this username or email already exists");
    }

    let avatarUrl;
    if (req.file?.path) {
        const uploadResult = await uploadOnCloudinary(req.file.path, "avatars");
        avatarUrl = uploadResult?.secure_url || uploadResult?.url;
        if (!avatarUrl) {
            throw new ApiError(500, "failed to upload avatar");
        }
    }

    const createdUser = await User.create({
        firstName,
        lastName,
        username,
        email,
        password,
        ...(avatarUrl ? { avatar: avatarUrl } : {})
    });

    if (!createdUser) {
        throw new ApiError(500, "error in creation of user");
    }

    const { password: _, ...userWithoutPassword } = createdUser.toObject();

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            userWithoutPassword,
            "user created successfully"
        ));
})

const loginUser = asyncHandler(async (req, res)=>{
    const {
        email,
        username,
        password
    } = req.body;

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;
    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : undefined;

    if(!normalizedEmail && !normalizedUsername){
        throw new ApiError(400,"username or email is requried");
    }
    if(!password){
        throw new ApiError(400, "password is required");
    }

    let existingUser = await User.findOne({
        $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
    });

    if(!existingUser){
        throw new ApiError(401, "invalid credentials");
    }

    const isPasswordCorrect = await existingUser.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid credentials");
    }

    const {password:_ , ...loggedinUser} = existingUser.toObject();

    const accessToken = existingUser.generateAccessToken();
    const refreshToken = existingUser.generateRefreshToken();


    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(
            200,
            {
                user:loggedinUser,
                refreshToken,
                accessToken
            },
            "loggedin successfully"
        ));


})


const logoutUser = asyncHandler( async (req,res)=>{
    // await User.findByIdAndUpdate(
    //     req.user.id,
    //     {
    //         $set : {
    //             refreshToken : undefined
    //         }
    //     },
    //     {
    //         new:true
    //     }
    // )

    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/"
    };

    const logoutmsg = (req.user?.username?? "user")+ " logged out successfully"
    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, logoutmsg))

})


const getProfile = asyncHandler(async (req, res)=>{
    const { username, id } = req.params;

    const query = username ? { username: username.toLowerCase().trim() } : { _id: id };

    const user = await User.findOne(query).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "user not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "profile fetched successfully"));
})

const getCurrentUser = asyncHandler(async (req, res)=>{
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
        throw new ApiError(401, "user not authenticated");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "user not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "current user fetched successfully"));
})

const updateProfile = asyncHandler(async (req, res)=>{
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
        throw new ApiError(401, "user not authenticated");
    }

    const { firstName, lastName, username, email } = req.body;

    const updates = {};

    if (typeof firstName === "string" && firstName.trim()) updates.firstName = firstName.trim();
    if (typeof lastName === "string") updates.lastName = lastName.trim();
    if (typeof username === "string" && username.trim()) updates.username = username.trim().toLowerCase();
    if (typeof email === "string" && email.trim()) {
        if (!isValidEmail(email)) {
            throw new ApiError(400, "enter a valid email");
        }
        updates.email = email.trim().toLowerCase();
    }
    

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "at least one valid field is required to update");
    }

    if (updates.username || updates.email) {
        const duplicate = await User.findOne({
            _id: { $ne: userId },
            $or: [
                ...(updates.username ? [{ username: updates.username }] : []),
                ...(updates.email ? [{ email: updates.email }] : [])
            ]
        });

        if (duplicate) {
            throw new ApiError(400, "user with this username or email already exists");
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "user not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "profile updated successfully"));
})

const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const fallbackUserId = req.query?.userId;
    const targetUserId = userId || fallbackUserId;

    if (!targetUserId) {
        throw new ApiError(400, "userId is required");
    }

    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 10;
    const isCommentQuery = req.query?.isComment;

    const filter = { userId: targetUserId };

    if (typeof isCommentQuery !== "undefined") {
        const normalized = String(isCommentQuery).trim().toLowerCase();
        if (normalized === "true") {
            filter.isComment = true;
        } else if (normalized === "false") {
            filter.isComment = false;
        } else {
            throw new ApiError(400, "isComment must be true or false");
        }
    }

    const [posts, total] = await Promise.all([
        Post.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("userId", "username firstName lastName avatar")
            .populate("parentPostId", "_id text"),
        Post.countDocuments(filter)
    ]);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                posts
            },
            "user posts fetched successfully"
        ));
})



export {
    signupUser,
    loginUser,
    logoutUser,
    getProfile,
    getCurrentUser,
    updateProfile,
    getUserPosts
}