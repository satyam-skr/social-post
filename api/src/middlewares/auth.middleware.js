import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import env from "../configs/env.js";

const getAccessTokenFromRequest = (req) => {
    const tokenFromCookie = req.cookies?.accessToken;
    if (tokenFromCookie) {
        return tokenFromCookie;
    }

    const authHeader = req.header("Authorization") || req.header("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7).trim();
    }

    return null;
};

export const verifyJWT = asyncHandler(async (req, _res, next) => {
    const token = getAccessTokenFromRequest(req);

    if (!token) {
        throw new ApiError(401, "access token missing");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "invalid or expired access token");
    }

    const user = await User.findById(decodedToken?._id).select("_id email username firstName lastName avatar");

    if (!user) {
        throw new ApiError(401, "user not found for provided token");
    }

    req.user = {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
    };

    next();
});
