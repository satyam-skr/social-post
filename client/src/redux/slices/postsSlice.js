import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI, commentAPI } from '@/services/api';

// Async thunks
export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await postAPI.getFeed({ page, limit, isComment: false });
      const payload = response.data ?? response;
      return { page: payload.page ?? page, totalPages: payload.totalPages, posts: payload.data ?? payload.posts ?? [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await postAPI.createPost(postData);
      return response.data?.post ?? response.data ?? response.post;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await postAPI.deletePost(postId);
      return postId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const togglePostLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postAPI.toggleLike(postId);
      return response.data?.post ?? response.data ?? response.post;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPostById(postId);
      return pickPost(response);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchComments = createAsyncThunk(
  'posts/fetchComments',
  async ({ parentPostId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await commentAPI.getComments({ parentPostId, page, limit });
      const payload = response.data ?? response;
      return {
        parentPostId,
        page: payload.page ?? page,
        totalPages: payload.totalPages,
        comments: payload.data ?? payload.posts ?? [],
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const pickPost = (response) => {
  return (
    response?.data?.post
    ?? response?.data?.data?.post
    ?? response?.data?.data
    ?? response?.data
    ?? response?.post
    ?? response
  );
};

// Initial state
const initialState = {
  posts: [],
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
  commentsByParent: {},
  currentPost: null,
};

// Slice
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch feed
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, page, totalPages } = action.payload;
        state.page = page;
        state.totalPages = totalPages || state.totalPages;
        if (page && page > 1) {
          state.posts = [...state.posts, ...posts];
        } else {
          state.posts = posts;
        }
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create post
    builder
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        const post = action.payload;
        if (post?.isComment && post?.parentPostId) {
          const list = state.commentsByParent[post.parentPostId]?.comments || [];
          state.commentsByParent[post.parentPostId] = {
            comments: [post, ...list],
            page: 1,
            totalPages: 1,
          };
        } else if (post) {
          state.posts.unshift(post);
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete post
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(post => post._id !== action.payload);
        if (state.currentPost?._id === action.payload) {
          state.currentPost = null;
        }
        Object.keys(state.commentsByParent).forEach((pid) => {
          const list = state.commentsByParent[pid]?.comments || [];
          state.commentsByParent[pid] = {
            ...state.commentsByParent[pid],
            comments: list.filter((c) => c._id !== action.payload),
          };
        });
      });

    // Toggle like
    builder
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated?._id) return;
        const idx = state.posts.findIndex(p => p._id === updated?._id);
        if (idx > -1) state.posts[idx] = { ...state.posts[idx], ...updated };
        if (state.currentPost?._id === updated._id) {
          state.currentPost = { ...state.currentPost, ...updated };
        }
        Object.keys(state.commentsByParent).forEach((pid) => {
          const list = state.commentsByParent[pid]?.comments || [];
          const cIdx = list.findIndex(c => c._id === updated?._id);
          if (cIdx > -1) list[cIdx] = { ...list[cIdx], ...updated };
        });
      });

    // Fetch post by id
    builder
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch comments
    builder
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { parentPostId, comments, page, totalPages } = action.payload;
        const existing = state.commentsByParent[parentPostId]?.comments || [];
        state.commentsByParent[parentPostId] = {
          comments: page && page > 1 ? [...existing, ...comments] : comments,
          page,
          totalPages: totalPages || state.commentsByParent[parentPostId]?.totalPages,
        };
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default postsSlice.reducer;
