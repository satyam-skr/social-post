import mongoose, { Schema } from "mongoose";
import env from "../configs/env.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    lastName: {
        type: String,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    avatar: {
        type: String, //url of the avatar
        default: "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg",
        required:false
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });


userSchema.pre("save", async function name() {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, env.HASH_ROUNDS)
})

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this.id,
            username: this.username,
            email: this.email,
            fullName: this.fullName,
        },
        env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: env.ACCESS_TOKEN_EXPIRY
        }
    );
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this.id,
        },
        env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: env.REFRESH_TOKEN_EXPIRY
        }
    );
}

userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema)