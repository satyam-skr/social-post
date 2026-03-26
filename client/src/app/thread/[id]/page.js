'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import styles from '../thread.module.css';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createPost, fetchComments, fetchPostById, togglePostLike } from '@/redux/slices/postsSlice';
import { loginUrlWithRedirect } from '@/utils/authRedirect';
import { Favorite as LikedIcon, FavoriteBorder as LikeIcon } from '@mui/icons-material';

const Body = ({ item }) => {
  const hasText = !!item?.text?.trim();
  const hasImage = Array.isArray(item?.imageUrls) && item.imageUrls.length > 0;
  return (
    <>
      {hasText && <p className={styles.bodyText}>{item.text}</p>}
      {hasImage && (
        <Image
          src={item.imageUrls[0]}
          alt="content"
          className={styles.image}
          width={1200}
          height={800}
          sizes="(max-width: 768px) 100vw, 640px"
        />
      )}
    </>
  );
};

export default function ThreadPage({ params }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const routeParams = useParams();
  const threadId = routeParams?.id || params?.id;
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const { currentPost, commentsByParent, loading } = useAppSelector(state => state.posts);
  const commentsPack = threadId ? commentsByParent[threadId] : null;
  const [draftComment, setDraftComment] = useState('');
  const [draftImages, setDraftImages] = useState([]);

  useEffect(() => {
    if (!threadId) return;
    dispatch(fetchPostById(threadId));
    dispatch(fetchComments({ parentPostId: threadId, page: 1, limit: 20 }));
  }, [dispatch, threadId]);

  const requireAuthOrRedirect = (targetPath) => {
    if (isAuthenticated) return true;
    router.push(loginUrlWithRedirect(targetPath || pathname || (threadId ? `/thread/${threadId}` : '/')));
    return false;
  };

  const onLike = () => {
    if (!threadId) return;
    if (!requireAuthOrRedirect(pathname || `/thread/${threadId}`)) return;
    dispatch(togglePostLike(threadId));
  };

  const onLikeItem = (postId) => {
    if (!postId) return;
    if (!requireAuthOrRedirect(pathname || `/thread/${threadId}`)) return;
    dispatch(togglePostLike(postId));
  };

  const onAddComment = async (e) => {
    e.preventDefault();
    if (!threadId) return;
    if (!requireAuthOrRedirect(pathname || `/thread/${threadId}`)) return;
    const text = draftComment.trim();
    if (!text && draftImages.length === 0) return;
    const action = await dispatch(createPost({ text, isComment: true, parentPostId: threadId, images: draftImages }));
    if (!action.error) {
      setDraftComment('');
      setDraftImages([]);
    }
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

  if (!threadId || (loading && !currentPost)) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.empty}>Loading thread...</p>
        </div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.empty}>Thread not found.</p>
          <Link href="/" className={styles.backLink}>Back to feed</Link>
        </div>
      </div>
    );
  }

  const owner = currentPost.userId;
  const directComments = commentsPack?.comments || [];
  const currentPostLiked = isLikedByCurrentUser(currentPost);
  const currentPostLikeCount = Array.isArray(currentPost?.likes) ? currentPost.likes.length : 0;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>← Back to feed</Link>

        <article className={styles.card}>
          <div className={styles.badge}>{currentPost.isComment ? 'Comment' : 'Post'}</div>
          <div className={styles.headerLine}>
            <Image
              src={owner?.avatar || 'https://i.pravatar.cc/80'}
              alt={owner?.username || 'User'}
              className={styles.avatar}
              width={52}
              height={52}
              role="button"
              tabIndex={0}
              onClick={(e) => onOpenUserProfile(e, owner?.username)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onOpenUserProfile(e, owner?.username);
                }
              }}
            />
            <div className={styles.names}>
              <span
                className={styles.firstName}
                role="button"
                tabIndex={0}
                onClick={(e) => onOpenUserProfile(e, owner?.username)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onOpenUserProfile(e, owner?.username);
                  }
                }}
              >
                {owner?.firstName || 'User'}
              </span>
              <span
                className={styles.username}
                role="button"
                tabIndex={0}
                onClick={(e) => onOpenUserProfile(e, owner?.username)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onOpenUserProfile(e, owner?.username);
                  }
                }}
              >
                @{owner?.username || 'unknown'}
              </span>
            </div>
          </div>
          <Body item={currentPost} />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onLike}
              className={`${styles.likeBtn} ${currentPostLiked ? styles.likeBtnActive : ''}`}
            >
              {currentPostLiked ? <LikedIcon fontSize="small" /> : <LikeIcon fontSize="small" />}
              {isAuthenticated
                ? (currentPostLiked ? `Liked (${currentPostLikeCount})` : `Like (${currentPostLikeCount})`)
                : `Login to Like (${currentPostLikeCount})`}
            </button>
          </div>
        </article>

        <section className={styles.card}>
          <div className={styles.sectionTitle}>Direct comments</div>
          <form onSubmit={onAddComment} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>
              <input
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                placeholder={isAuthenticated ? 'Write a comment...' : 'Login to comment'}
                style={{ width: '100%' }}
              />
              <label style={{ fontSize: 12 }}>
                Add images (max 5)
                <input type="file" accept="image/*" multiple onChange={onSelectImages} />
              </label>
              {draftImages.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {draftImages.map((file, idx) => (
                    <li key={`${file.name}-${idx}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{file.name}</span>
                      <button type="button" onClick={() => removeImage(idx)}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" disabled={loading}>Comment</button>
          </form>
          {directComments.length > 0 && (
            <div className={styles.commentList}>
              {directComments.map((comment) => {
                const commentOwner = comment.userId;
                const commentLiked = isLikedByCurrentUser(comment);
                const commentLikeCount = Array.isArray(comment?.likes) ? comment.likes.length : 0;
                return (
                  <Link
                    href={`/thread/${comment._id}`}
                    key={comment._id}
                    className={styles.commentCard}
                  >
                    <div className={styles.badge}>Comment</div>
                    <div className={styles.headerLine}>
                      <Image
                        src={commentOwner?.avatar || 'https://i.pravatar.cc/80'}
                        alt={commentOwner?.username || 'User'}
                        className={styles.avatar}
                        width={52}
                        height={52}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => onOpenUserProfile(e, commentOwner?.username)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onOpenUserProfile(e, commentOwner?.username);
                          }
                        }}
                      />
                      <div className={styles.names}>
                        <span
                          className={styles.firstName}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => onOpenUserProfile(e, commentOwner?.username)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              onOpenUserProfile(e, commentOwner?.username);
                            }
                          }}
                        >
                          {commentOwner?.firstName || 'User'}
                        </span>
                        <span
                          className={styles.username}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => onOpenUserProfile(e, commentOwner?.username)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              onOpenUserProfile(e, commentOwner?.username);
                            }
                          }}
                        >
                          @{commentOwner?.username || 'unknown'}
                        </span>
                      </div>
                    </div>
                    <Body item={comment} />
                    <div className={styles.commentActions}>
                      <button
                        type="button"
                        className={`${styles.likeBtn} ${commentLiked ? styles.likeBtnActive : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onLikeItem(comment._id);
                        }}
                      >
                        {commentLiked ? <LikedIcon fontSize="small" /> : <LikeIcon fontSize="small" />}
                        {isAuthenticated
                          ? (commentLiked ? `Liked (${commentLikeCount})` : `Like (${commentLikeCount})`)
                          : `Login to Like (${commentLikeCount})`}
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
