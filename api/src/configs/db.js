import mongoose from 'mongoose'
import env from "./env.js";

let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        const connectionInstance = await mongoose.connect(env.DATABASE_URL);
        isConnected = connectionInstance.connections[0].readyState === 1;

        console.log(`MongoDB connected!! Host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log(`Database connection error : ${error}`);
        process.exit(1);
    }
}

export { connectDB }