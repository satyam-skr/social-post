import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI, userAPI } from '@/services/api';

// Async thunks
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getCurrentUser();
      return response.data ?? response;
    } catch (error) {
      // Treat unauthenticated as a clean "logged out" state.
      if (String(error?.message || '').toLowerCase().includes('access token')) {
        return rejectWithValue('unauthenticated');
      }
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      return response.data ?? response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const payload = response.data ?? response;
      return payload?.user || null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(payload);
      return response.data ?? response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === 'unauthenticated') {
          state.user = null;
          state.isAuthenticated = false;
          state.error = null;
          return;
        }
        state.error = action.payload;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Signup
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        // Signup does not set cookies on backend; login is performed after signup in the UI flow.
        state.user = action.payload || null;
        state.isAuthenticated = false;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
