# Social Post API Documentation

## 1. Overview
This document defines all currently implemented APIs in the service and their exact request and response formats.

Base URL (local):
- `http://localhost:<PORT>`

Current route prefixes from the app:
- Health: `/api/health`
- User: `/api/user`
- Post: `/api/post`

Example full base URL:
- `http://localhost:8000/api`

## 2. Common Conventions

### 2.1 Content Types
- Most endpoints use `application/json`.
- Post creation with images uses `multipart/form-data`.

### 2.2 Auth and User Context (Current Temporary Fallback)
Auth is enforced via `verifyJWT` on protected routes only. Public routes do not require login.

### 2.3 Standard Success Wrapper
Most endpoints return:
```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": {},
  "success": true
}
```

`success` is true when `statusCode < 400`.

### 2.4 Error Response Format
Error handler returns ApiError-based responses. Typical fields:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "success": false,
  "errors": []
}
```

## 3. Data Models (As Implemented)

### 3.1 User
Fields:
- `_id`: ObjectId
- `firstName`: string (required)
- `lastName`: string
- `username`: string (required, unique, lowercase)
- `email`: string (required, unique)
- `password`: string (hashed before save)
- `avatar`: string URL (default provided)
- `refreshToken`: string
- `createdAt`, `updatedAt`: timestamps

### 3.2 Post
Fields:
- `_id`: ObjectId
- `text`: string (min 10 if provided)
- `imageUrls`: string[] (Cloudinary URLs)
- `likes`: ObjectId[] (references User)
- `comments`: ObjectId[] (references Post, currently not actively maintained by controller)
- `isComment`: boolean
- `parentPostId`: ObjectId | null (references Post)
- `userId`: ObjectId (references User)

## 4. API Endpoints

## 4.1 Health APIs

### 4.1.1 Health Check
- Method: `GET`
- URL: `/api/health`
- Request body: none

Success response (example):
```json
{
  "statusCode": 200,
  "message": "healthy",
  "data": {},
  "success": true
}
```

## 4.2 User APIs

### 4.2.1 Signup
- Method: `POST`
- URL: `/api/user/signup`
- Content-Type: `application/json`

Request body:
```json
{
  "firstName": "Satyam",
  "lastName": "Singh",
  "username": "satyam01",
  "email": "satyam@example.com",
  "password": "StrongPass123"
}
```

Validation:
- Required: `firstName`, `username`, `email`, `password`
- `email` must be valid format.
- `username` and `email` must be unique.

Success response:
```json
{
  "statusCode": 201,
  "message": "user created successfully",
  "data": {
    "_id": "6601d50f7f2e26b4e49757a1",
    "firstName": "satyam",
    "lastName": "singh",
    "username": "satyam01",
    "email": "satyam@example.com",
    "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg",
    "createdAt": "2026-03-26T12:00:00.000Z",
    "updatedAt": "2026-03-26T12:00:00.000Z",
    "__v": 0
  },
  "success": true
}
```

### 4.2.2 Login
- Method: `POST`
- URL: `/api/user/login`
- Content-Type: `application/json`

Request body (one of username/email + password):
```json
{
  "email": "satyam@example.com",
  "password": "StrongPass123"
}
```
or
```json
{
  "username": "satyam01",
  "password": "StrongPass123"
}
```

Success response:
```json
{
  "statusCode": 200,
  "message": "loggedin successfully",
  "data": {
    "user": {
      "_id": "6601d50f7f2e26b4e49757a1",
      "firstName": "satyam",
      "lastName": "singh",
      "username": "satyam01",
      "email": "satyam@example.com",
      "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg",
      "createdAt": "2026-03-26T12:00:00.000Z",
      "updatedAt": "2026-03-26T12:00:00.000Z",
      "__v": 0
    },
    "refreshToken": "<jwt>",
    "accessToken": "<jwt>"
  },
  "success": true
}
```

Cookies set:
- `accessToken`
- `refreshToken`

### 4.2.3 Logout
- Method: `POST`
- URL: `/api/user/logout`

Request body: none

Success response:
```json
{
  "statusCode": 200,
  "message": "user logged out successfully",
  "data": {},
  "success": true
}
```

Cookies cleared:
- `accessToken`
- `refreshToken`

### 4.2.4 Get Current User
- Method: `GET`
- URL: `/api/user/me`

Current fallback options:
- Preferred: authenticated `req.user`
- Fallback: query `?userId=<ObjectId>`

Success response:
```json
{
  "statusCode": 200,
  "message": "current user fetched successfully",
  "data": {
    "_id": "6601d50f7f2e26b4e49757a1",
    "firstName": "satyam",
    "lastName": "singh",
    "username": "satyam01",
    "email": "satyam@example.com",
    "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg"
  },
  "success": true
}
```

### 4.2.5 Update Current User Profile
- Method: `PATCH`
- URL: `/api/user/me/update`
- Content-Type: `application/json`

Current fallback options:
- Preferred: authenticated `req.user`
- Fallback: query `?userId=<ObjectId>`

Request body (any one or multiple):
```json
{
  "firstName": "Sat",
  "lastName": "Kumar",
  "username": "sat_dev",
  "email": "sat.dev@example.com"
}
```

Success response:
```json
{
  "statusCode": 200,
  "message": "profile updated successfully",
  "data": {
    "_id": "6601d50f7f2e26b4e49757a1",
    "firstName": "Sat",
    "lastName": "Kumar",
    "username": "sat_dev",
    "email": "sat.dev@example.com",
    "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg"
  },
  "success": true
}
```

### 4.2.6 Get Public User Profile by Username
- Method: `GET`
- URL: `/api/user/:username/profile`

Path params:
- `username`: string

Success response:
```json
{
  "statusCode": 200,
  "message": "profile fetched successfully",
  "data": {
    "_id": "6601d50f7f2e26b4e49757a1",
    "firstName": "satyam",
    "lastName": "singh",
    "username": "satyam01",
    "email": "satyam@example.com",
    "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg"
  },
  "success": true
}
```

### 4.2.7 Get Posts by User ID
- Method: `GET`
- URL: `/api/user/:userId/posts`

Path params:
- `userId`: ObjectId

Query params:
- `page` (optional, default `1`)
- `limit` (optional, default `10`)

Success response:
```json
{
  "statusCode": 200,
  "message": "user posts fetched successfully",
  "data": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "posts": [
      {
        "_id": "6601d9f97f2e26b4e49757f0",
        "text": "This is a sample post with enough text length.",
        "imageUrls": [],
        "likes": [],
        "isComment": false,
        "parentPostId": null,
        "userId": {
          "_id": "6601d50f7f2e26b4e49757a1",
          "username": "satyam01",
          "firstName": "satyam",
          "lastName": "singh",
          "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg"
        }
      }
    ]
  },
  "success": true
}
```

## 4.3 Post APIs

### 4.3.1 Create Post or Comment
- Method: `POST`
- URL: `/api/post/create`
- Content-Type: `multipart/form-data`

Form fields:
- `text` (optional but required if no images)
- `isComment` (optional, `true` or `false`)
- `parentPostId` (required when `isComment=true`)
- `photos` (optional, multiple files up to 5)

Validation rules:
- At least one of text or image is required.
- If `isComment=true`, `parentPostId` must be present and valid existing post id.

Success response:
```json
{
  "statusCode": 201,
  "message": "post created successfully",
  "data": {
    "post": {
      "_id": "6601db2f7f2e26b4e4975811",
      "text": "This is a comment text with enough length.",
      "imageUrls": [],
      "likes": [],
      "isComment": true,
      "parentPostId": "6601d9f97f2e26b4e49757f0",
      "userId": "6601d50f7f2e26b4e49757a1"
    }
  },
  "success": true
}
```

### 4.3.2 Get Feed (Top-level posts only)
- Method: `GET`
- URL: `/api/post/all`

Query params:
- `page` (optional, default `1`)
- `limit` (optional, default `10`)
- `isComment` (optional, boolean)
- `parentPostId` (required when `isComment=true`)

Success response:
```json
{
  "statusCode": 200,
  "message": "posts fetched successfully",
  "data": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2,
    "data": [
      {
        "_id": "6601d9f97f2e26b4e49757f0",
        "text": "This is a sample post with enough text length.",
        "imageUrls": [],
        "likes": ["6601d50f7f2e26b4e49757a1"],
        "isComment": false,
        "parentPostId": null,
        "userId": {
          "_id": "6601d50f7f2e26b4e49757a1",
          "username": "satyam01",
          "firstName": "satyam",
          "lastName": "singh",
          "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg"
        }
      }
    ]
  },
  "success": true
}
```

Comments listing via the same endpoint:
- `GET /api/post/all?isComment=true&parentPostId=<postId>`

### 4.3.3 Get Post By ID
- Method: `GET`
- URL: `/api/post/:postId`
- Auth: Public

Success response:
```json
{
  "statusCode": 200,
  "message": "post fetched successfully",
  "data": {
    "_id": "6601d9f97f2e26b4e49757f0",
    "text": "This is a sample post with enough text length.",
    "imageUrls": [],
    "likes": [],
    "isComment": false,
    "parentPostId": null,
    "userId": {
      "_id": "6601d50f7f2e26b4e49757a1",
      "username": "satyam01",
      "firstName": "satyam",
      "lastName": "singh",
      "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg"
    }
  },
  "success": true
}
```

### 4.3.4 Delete Post
- Method: `DELETE`
- URL: `/api/post/:postId`

Path params:
- `postId`: ObjectId

Auth:
- Protected via `verifyJWT`. Only the owner can delete.

Behavior:
- Only owner of the post can delete.
- Deletes the post.
- Deletes all posts whose `parentPostId == postId` (cascade delete for comments).
- Attempts to delete post images from Cloudinary.

Success response:
```json
{
  "statusCode": 200,
  "message": "post deleted successfully",
  "data": {},
  "success": true
}
```

### 4.3.5 Toggle Like / Unlike
- Method: `PATCH`
- URL: `/api/post/:postId/like`

Path params:
- `postId`: ObjectId

Auth:
- Protected via `verifyJWT`.

Success response (when liked):
```json
{
  "statusCode": 200,
  "message": "post liked",
  "data": {
    "liked": true,
    "likesCount": 4,
    "post": {
      "_id": "6601d9f97f2e26b4e49757f0",
      "text": "This is a sample post with enough text length.",
      "likes": [
        "6601d50f7f2e26b4e49757a1"
      ],
      "userId": {
        "_id": "6601d50f7f2e26b4e49757a1",
        "username": "satyam01",
        "firstName": "satyam",
        "lastName": "singh",
        "avatar": "https://images.pexels.com/photos/4641440/pexels-photo-4641440.jpeg"
      }
    }
  },
  "success": true
}
```

Response when unliked is same format with:
- `message = "post unliked"`
- `liked = false`

## 5. How Comments Are Implemented Using Post Model Only

Comments are stored in the same MongoDB collection as posts (`Post` model), instead of a separate `Comment` collection.

Implementation details:
- A normal post has:
  - `isComment: false`
  - `parentPostId: null`
- A comment has:
  - `isComment: true`
  - `parentPostId: <ObjectId of parent post>`

Creation flow:
1. Client calls `/api/post/create`.
2. If `isComment=true`, server requires `parentPostId`.
3. Server validates that parent post exists.
4. Server creates a new `Post` document with `isComment=true` and `parentPostId` set.

Feed behavior:
- `/api/post/all` fetches only top-level posts using `isComment: false`.
- Comments are excluded from feed automatically.

User posts behavior:
- `/api/user/:userId/posts` also fetches top-level user posts with `isComment: false`.

Delete behavior:
- Deleting a post also deletes all child comments by:
  - `Post.deleteMany({ parentPostId: postId })`

Advantages of this design:
- Single collection for content entities.
- Reuse same fields for text/images/likes/author.
- Simpler indexing and common query patterns.

Important caveat for teams:
- `comments` array field exists in schema but is not currently populated by controller logic.
- Parent-child relation is maintained via `parentPostId` query pattern.

## 6. Example Mock Data for Integration Testing

Mock User:
```json
{
  "_id": "6601d50f7f2e26b4e49757a1",
  "firstName": "satyam",
  "lastName": "singh",
  "username": "satyam01",
  "email": "satyam@example.com"
}
```

Mock Top-level Post:
```json
{
  "_id": "6601d9f97f2e26b4e49757f0",
  "text": "This is a sample top-level post for API testing.",
  "imageUrls": [],
  "isComment": false,
  "parentPostId": null,
  "userId": "6601d50f7f2e26b4e49757a1"
}
```

Mock Comment (stored in Post collection):
```json
{
  "_id": "6601db2f7f2e26b4e4975811",
  "text": "This is a sample comment on the parent post.",
  "imageUrls": [],
  "isComment": true,
  "parentPostId": "6601d9f97f2e26b4e49757f0",
  "userId": "6601d50f7f2e26b4e49757a1"
}
```

## 7. Known Gaps (Current Implementation)
1. Dedicated comment endpoints are not exposed yet; comments are created through `/api/post/create` with `isComment=true`.
2. Strict auth middleware is not enforced across all endpoints (feed/thread reads are intentionally public).
4. User model has an email schema typo (`lowecase`) in model definition; current controller still manually lowercases updates.

## 8. Recommended Next Version Improvements
1. Add strict authentication middleware and remove all fallback `userId` query/body usage.
2. Add dedicated endpoints:
   - `GET /api/post/:postId/comments`
   - `DELETE /api/post/:postId/comments/:commentId`
3. Standardize all responses via `ApiResponse` wrapper.
4. Add OpenAPI/Swagger spec for machine-readable contract sharing.
