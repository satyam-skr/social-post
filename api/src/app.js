import express from 'express';
import { notFound, globalErrorHandler } from './middlewares/globalErrorHandler.middleware.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js';
import env from './configs/env.js';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());


// routes import 
import healthRouter from './routes/health.route.js';
import userRouter from './routes/user.route.js';
import postRouter from './routes/post.route.js';


// routes use
app.use("/api/health", healthRouter);
app.use("/api/user", userRouter);
app.use("/api/post",postRouter);


app.use(notFound);
app.use(globalErrorHandler);

export default app;