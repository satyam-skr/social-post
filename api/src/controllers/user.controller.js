import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from '../utils/asyncHandler.js';

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

    const createdUser = await User.create({
        firstName,
        lastName,
        username,
        email,
        password
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

    if(!email && !username){
        throw new ApiError(400,"username or email is requried");
    }
    if(!password){
        throw new ApiError(400, "password is required");
    }

    let existingUser = await User.findOne({
        $or: [{username},{email}]
    });

    if(!existingUser){
        throw new ApiError(400, "invalid credentials");
    }

    const isPasswordCorrect = await existingUser.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid credentials");
    }

    const {password:_ , ...loggedinUser} = existingUser.toObject();

    const accessToken = existingUser.generateAccessToken();
    const refreshToken = existingUser.generateRefreshToken();


    return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
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

export {
    signupUser,
    loginUser
}