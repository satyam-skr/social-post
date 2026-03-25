import "dotenv/config";
import { ApiError } from "../utils/ApiError.js";

const env = {};

const variables = [
    "PORT",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "DATABASE_URL",
    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",
    "HASH_ROUNDS"
];

variables.forEach(element => {
    if (process.env[element] === undefined) {
        throw new ApiError(`${element} not found in environment variables`);
    }
    else {
        env[element] = process.env[element];
        if (element === "HASH_ROUNDS") {
            env[element] = Number(env[element]);
        }
    }
});

export default env;