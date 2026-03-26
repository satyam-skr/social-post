'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createPost, fetchFeed, togglePostLike } from '@/redux/slices/postsSlice';
import {
  Home as HomeIcon,
  AddCircleOutline as AddIcon,
  Favorite as LikedIcon,
  FavoriteBorder as LikeIcon,
  ChatBubbleOutline as CommentIcon,
  PersonOutline as ProfileIcon,
} from '@mui/icons-material';
import { loginUrlWithRedirect } from '@/utils/authRedirect';

const PAGE_SIZE = 10;

export default function DemoPage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const { posts, page, totalPages, loading } = useAppSelector(state => state.posts);
  const router = useRouter();
  const pathname = usePathname();
  const feedRef = useRef(null);
  const isFetchingMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftImages, setDraftImages] = useState([]);

  useEffect(() => {
    dispatch(fetchFeed({ page: 1, limit: PAGE_SIZE })).unwrap().then((res) => {
      setHasMore(!res.totalPages || res.page < res.totalPages);
    }).catch(() => setHasMore(false));
  }, [dispatch]);

  const handleScroll = () => {
    const node = feedRef.current;
    if (!node || !hasMore || loading || isFetchingMoreRef.current) return;
    const fromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (fromBottom < 220) {
      isFetchingMoreRef.current = true;
      const nextPage = (page || 1) + 1;
      dispatch(fetchFeed({ page: nextPage, limit: PAGE_SIZE })).unwrap().then((res) => {
        setHasMore(!res.totalPages || res.page < res.totalPages);
      }).catch(() => setHasMore(false)).finally(() => {
        isFetchingMoreRef.current = false;
      });
    }
  };

  const renderPostBody = (post) => {
    const hasText = !!post.text?.trim();
    const hasImage = Array.isArray(post.imageUrls) && post.imageUrls.length > 0;

    return (
      <div className={styles.postBody}>
        {hasText && <p className={styles.postText}>{post.text}</p>}
        {hasImage && (
          <Image
            src={post.imageUrls[0]}
            alt="Post content"
            className={styles.postImage}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 100vw, 640px"
          />
        )}
      </div>
    );
  };

  const requireAuthOrRedirect = (targetPath) => {
    if (isAuthenticated) return true;
    router.push(loginUrlWithRedirect(targetPath || pathname || '/'));
    return false;
  };

  const onLike = (postId) => {
    if (!requireAuthOrRedirect(pathname || '/')) return;
    dispatch(togglePostLike(postId));
  };

  const onNewPost = () => {
    if (!requireAuthOrRedirect(pathname || '/')) return;
    setIsCreateOpen(true);
  };

  const onSelectImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const next = [...draftImages, ...files].slice(0, 5);
    setDraftImages(next);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setDraftImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitPost = async () => {
    const text = draftText.trim();
    if (!text && draftImages.length === 0) return;
    const action = await dispatch(createPost({ text, images: draftImages }));
    if (!action.error) {
      setDraftText('');
      setDraftImages([]);
      setIsCreateOpen(false);
    }
  };

  const onOpenUserProfile = (e, username) => {
    e.stopPropagation();
    if (!username) return;
    router.push(`/profile/${username}`);
  };

  const isLikedByCurrentUser = (post) => {
    if (!user?._id) return false;
    const likes = Array.isArray(post?.likes) ? post.likes : [];
    return likes.some((likedUser) => {
      if (typeof likedUser === 'string') return likedUser === user._id;
      return likedUser?._id === user._id;
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.composerCard}>
          <div className={styles.composerHeader}>
            <h1>Feed</h1>
            <p>See what everyone is sharing</p>
          </div>
          {!isAuthenticated && (
            <p className={styles.authHint}>
              You can browse feed without login. For like, comment, post, and profile access,
              please <Link href="/login">login</Link> or <Link href="/signup">signup</Link>.
            </p>
          )}
        </header>

        <section className={styles.feed} ref={feedRef} onScroll={handleScroll}>
          {posts.length === 0 && !loading && (
            <div className={styles.pagePlaceholder}>No posts yet.</div>
          )}
          {posts.map((post) => {
            const liked = isLikedByCurrentUser(post);
            const likeCount = Array.isArray(post?.likes) ? post.likes.length : 0;
            return (
            <article
              className={styles.postCard}
              key={post._id}
              onClick={() => router.push(`/thread/${post._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') router.push(`/thread/${post._id}`);
              }}
            >
              <div className={styles.cardLink}>
                <div className={styles.postLayout}>
                  <Image
                    src={post.userId?.avatar || 'https://i.pravatar.cc/80'}
                    alt={post.userId?.username || 'User avatar'}
                    className={styles.avatar}
                    width={56}
                    height={56}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => onOpenUserProfile(e, post.userId?.username)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onOpenUserProfile(e, post.userId?.username);
                      }
                    }}
                  />
                  <div className={styles.postContent}>
                    <div className={styles.userLine}>
                      <span
                        className={styles.firstName}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => onOpenUserProfile(e, post.userId?.username)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onOpenUserProfile(e, post.userId?.username);
                          }
                        }}
                      >
                        {post.userId?.firstName || 'User'}
                      </span>
                      <span
                        className={styles.username}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => onOpenUserProfile(e, post.userId?.username)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onOpenUserProfile(e, post.userId?.username);
                          }
                        }}
                      >
                        @{post.userId?.username || 'unknown'}
                      </span>
                    </div>
                    {renderPostBody(post)}
                  </div>
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${liked ? styles.likedBtn : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(post._id);
                  }}
                >
                  {liked ? <LikedIcon fontSize="small" /> : <LikeIcon fontSize="small" />}
                  {isAuthenticated ? (liked ? `Liked (${likeCount})` : `Like (${likeCount})`) : `Login to Like (${likeCount})`}
                </button>
                <Link
                  href={isAuthenticated ? `/thread/${post._id}` : loginUrlWithRedirect(`/thread/${post._id}`)}
                  className={styles.commentLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={styles.actionBtn}>
                    <CommentIcon fontSize="small" />
                    {isAuthenticated ? 'Comment' : 'Login to Comment'}
                  </span>
                </Link>
              </div>
            </article>
            );
          })}
          {loading && <div className={styles.pagePlaceholder}>Loading...</div>}
        </section>

        <nav className={styles.bottomNav}>
          <button type="button" className={styles.navItem}>
            <HomeIcon fontSize="small" />
            Home
          </button>
          <button
            type="button"
            className={styles.navItem}
            onClick={onNewPost}
            aria-label="Create post"
            title="Create post"
          >
            <AddIcon fontSize="small" />
          </button>
          <Link
            href={isAuthenticated ? '/profile' : loginUrlWithRedirect('/profile')}
            className={styles.navItemLink}
          >
            <span className={styles.navItem}>
              <ProfileIcon fontSize="small" />
              Profile
            </span>
          </Link>
        </nav>

        {isCreateOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsCreateOpen(false)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <h2>Create a new post</h2>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className={styles.composerInput}
                placeholder="Write text (optional)"
              />
              <div className={styles.imagePickRow}>
                <label className={styles.imagePickLabel}>
                  Add images (max 5)
                  <input type="file" accept="image/*" multiple onChange={onSelectImages} />
                </label>
                <span>{draftImages.length}/5 selected</span>
              </div>
              {draftImages.length > 0 && (
                <ul className={styles.imageList}>
                  {draftImages.map((file, idx) => (
                    <li key={`${file.name}-${idx}`}>
                      <span>{file.name}</span>
                      <button type="button" onClick={() => removeImage(idx)}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className={styles.postBtn} onClick={submitPost} disabled={loading}>
                Upload / Create Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
