import { ApiError } from "../utils/ApiError.js";

export const globalErrorHandler = (err, req, res, next) => {
    
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors || []
        });
    }

    // Log error for debugging
    console.error('Unhandled error:', err.message, err.stack);

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: []
    });
}

export const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};