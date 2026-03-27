import { createSlice } from '@reduxjs/toolkit';

// Comments are managed in postsSlice via commentsByParent.
// Keep this slice lightweight to preserve store shape compatibility.
const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    commentsByPost: {},
    loading: false,
    error: null,
  },
  reducers: {},
});

export default commentsSlice.reducer;
