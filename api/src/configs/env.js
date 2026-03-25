import "dotenv/config";
import { ApiError } from "../utils/ApiError.js";

const env = {};

if(process.env.PORT === undefined){
    throw new ApiError("PORT not found in environment variables.")
    process.exit(1);
}
else{
    env.PORT = process.env.PORT;
}

if(process.env.CLOUDINARY_CLOUD_NAME === undefined){
    throw new ApiError(500, "Cloudinary cloud name not found in environment variables")
}
else{
    env.CLOUDINARY_CLOUD_NAME=process.env.CLOUDINARY_CLOUD_NAME;
}
if(process.env.CLOUDINARY_API_KEY === undefined){
    throw new ApiError(500, "Cloudinary api key not found in environment variables")
}
else{
    env.CLOUDINARY_API_KEY=process.env.CLOUDINARY_API_KEY;
}
if(process.env.CLOUDINARY_API_SECRET === undefined){
    throw new ApiError(500, "Cloudinary api secret not found in environment variables")
}
else{
    env.CLOUDINARY_API_SECRET=process.env.CLOUDINARY_API_SECRET;
}

if(process.env.DATABASE_URL === undefined){
    throw new ApiError(500, "DATABASE url not found in environment variables");
    process.exit(1);
}
else{
    env.DATABASE_URL = process.env.DATABASE_URL;
}

if(process.env.ACCESS_TOKEN_SECRET === undefined){
    throw new ApiError(500, "Access token secret not found in environment variables");
    process.exit(1);
}
else{
    env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
}




if(process.env.HASH_ROUNDS === undefined){
    env.HASH_ROUNDS = 10;
}
else{
    env.HASH_ROUNDS = Number(process.env.HASH_ROUNDS);
}


export default env;