import { configureStore } from '@reduxjs/toolkit';
import postsReducer from './slices/postsSlice';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import commentsReducer from './slices/commentsSlice';

export const store = configureStore({
  reducer: {
    posts: postsReducer,
    comments: commentsReducer,
    auth: authReducer,
    users: usersReducer,
  },
});

export default store;
