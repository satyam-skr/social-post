import express from 'express';
import { notFound, globalErrorHandler } from './middlewares/globalErrorHandler.middleware.js';

const app = express();


// routes import 
import healthRouter from './routes/health.route.js'


// routes use
app.use("/health", healthRouter);


app.use(notFound);
app.use(globalErrorHandler);

export default app;