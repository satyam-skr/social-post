import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '@/services/api';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'users/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'users/fetchPosts',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userAPI.getUserPosts(userId);
      return { userId, posts: response.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  profiles: {}, // { userId: userData }
  postsByUser: {}, // { userId: [posts] }
  loading: false,
  error: null,
};

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.profiles[action.payload.id] = action.payload;
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch user posts
    builder
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        const { userId, posts } = action.payload;
        state.postsByUser[userId] = posts;
      });
  },
});

export default usersSlice.reducer;
