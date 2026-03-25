import express from 'express';
import { notFound, globalErrorHandler } from './middlewares/globalErrorHandler.middleware.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (env.ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new ApiError(400, 'Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(cookieParser());


// routes import 
import healthRouter from './routes/health.route.js';
import userRouter from './routes/user.route.js';
import { ApiError } from './utils/ApiError.js';


// routes use
app.use("/api/health", healthRouter);
app.use("/api/user", userRouter);


app.use(notFound);
app.use(globalErrorHandler);

export default app;