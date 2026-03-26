import { API_BASE_URL } from './config';

const jsonOrThrow = async (response, fallbackMessage) => {
  const raw = await response.text().catch(() => '');
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }
  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage || 'Request failed');
  }
  return data;
};

// Backend may return either ApiResponse wrapper or a plain payload (legacy).
export const pickData = (payload) => payload?.data ?? payload;

// ==================== POST SERVICES ====================
export const postAPI = {
  getFeed: async ({ page = 1, limit = 10, parentPostId, isComment } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (parentPostId) params.set('parentPostId', parentPostId);
    if (typeof isComment === 'boolean') params.set('isComment', String(isComment));

    const response = await fetch(`${API_BASE_URL}/api/post/all?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Failed to fetch feed');
  },

  getPostById: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/api/post/${postId}`, {
      method: 'GET',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Failed to fetch post');
  },

  createPost: async ({ text, images = [], isComment = false, parentPostId }) => {
    const form = new FormData();
    if (text) form.append('text', text);
    if (isComment) form.append('isComment', 'true');
    if (isComment && parentPostId) form.append('parentPostId', parentPostId);
    images.forEach((file) => form.append('photos', file));

    const response = await fetch(`${API_BASE_URL}/api/post/create`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    return jsonOrThrow(response, 'Failed to create post');
  },

  deletePost: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/api/post/${postId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Failed to delete post');
  },

  toggleLike: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/api/post/${postId}/like`, {
      method: 'PATCH',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Failed to toggle like');
  },
};

// ==================== COMMENT SERVICES ====================
export const commentAPI = {
  getComments: async ({ parentPostId, page = 1, limit = 10 }) => {
    return postAPI.getFeed({ page, limit, parentPostId, isComment: true });
  },

  addComment: async ({ parentPostId, text, images = [] }) => {
    return postAPI.createPost({ text, images, isComment: true, parentPostId });
  },

  deleteComment: async (commentId) => {
    return postAPI.deletePost(commentId);
  },
};

// ==================== USER SERVICES ====================
export const userAPI = {
  getProfileByUsername: async (username) => {
    const response = await fetch(`${API_BASE_URL}/api/user/${username}/profile`, {
      method: 'GET',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Failed to fetch profile');
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/api/user/me`, {
      method: 'GET',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Failed to fetch current user');
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/api/user/me/update`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return jsonOrThrow(response, 'Failed to update profile');
  },

  getUserPosts: async ({ userId, page = 1, limit = 10, isComment } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (typeof isComment === 'boolean') params.set('isComment', String(isComment));

    const response = await fetch(`${API_BASE_URL}/api/user/${userId}/posts?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Failed to fetch user posts');
  },
};

// ==================== AUTH SERVICES ====================
export const authAPI = {
  // Login
  login: async ({ username, email, password }) => {
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });
    return jsonOrThrow(response, 'Login failed');
  },

  // Logout
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/user/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return jsonOrThrow(response, 'Logout failed');
  },

  // Register
  register: async ({ firstName, lastName, username, email, password, avatar } = {}) => {
    const form = new FormData();
    if (firstName) form.append('firstName', firstName);
    if (typeof lastName === 'string') form.append('lastName', lastName);
    if (username) form.append('username', username);
    if (email) form.append('email', email);
    if (password) form.append('password', password);
    if (avatar) form.append('avatar', avatar);

    const response = await fetch(`${API_BASE_URL}/api/user/signup`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    return jsonOrThrow(response, 'Signup failed');
  },
};

const api = { postAPI, commentAPI, userAPI, authAPI };
export default api;
