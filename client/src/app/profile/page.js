'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginUrlWithRedirect } from '@/utils/authRedirect';
import styles from './profile.module.css';
import { userAPI } from '@/services/api';
import { logoutUser } from '@/redux/slices/authSlice';
import { togglePostLike } from '@/redux/slices/postsSlice';
import {
  Home as HomeIcon,
  AddCircleOutline as AddIcon,
  PersonOutline as ProfileIcon,
  Favorite as LikedIcon,
  FavoriteBorder as LikeIcon,
  ChatBubbleOutline as CommentIcon,
  ArticleOutlined as PostIcon,
} from '@mui/icons-material';

const FALLBACK_AVATAR = 'https://i.pravatar.cc/120?img=25';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const fullName = useMemo(() => {
    const first = user?.firstName || '';
    const last = user?.lastName || '';
    return `${first} ${last}`.trim() || 'Unknown User';
  }, [user?.firstName, user?.lastName]);

  const profileImage = user?.avatar || FALLBACK_AVATAR;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(loginUrlWithRedirect('/profile'));
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    let ignore = false;

    const loadUserActivity = async () => {
      if (!isAuthenticated || !user?._id) return;
      setLoading(true);
      setError('');
      try {
        const response = await userAPI.getUserPosts({ userId: user._id, page: 1, limit: 50 });
        const payload = response?.data ?? response;
        const list = payload?.data ?? payload?.posts ?? [];
        if (!ignore) setItems(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Failed to load activity');
          setItems([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadUserActivity();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?._id]);

  if (!isAuthenticated) {
    return (
      <main className={styles.redirectWrap}>
        <h1>Profile</h1>
        <p>Redirecting to login...</p>
        <p><Link href={loginUrlWithRedirect('/profile')}>Go to login</Link></p>
      </main>
    );
  }

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const isLikedByCurrentUser = (post) => {
    if (!user?._id) return false;
    const likes = Array.isArray(post?.likes) ? post.likes : [];
    return likes.some((likedUser) => {
      if (typeof likedUser === 'string') return likedUser === user._id;
      return likedUser?._id === user._id;
    });
  };

  const onLike = (postId) => {
    if (!postId) return;
    dispatch(togglePostLike(postId)).unwrap().then((updated) => {
      setItems((prev) => prev.map((item) => (item?._id === updated?._id ? { ...item, ...updated } : item)));
    }).catch(() => {
      setError('Failed to toggle like');
    });
  };

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.profileCard}>
          <Image
            src={profileImage}
            alt={`${user?.username || 'user'} avatar`}
            className={styles.avatar}
            width={120}
            height={120}
          />
          <div className={styles.profileMeta}>
            <h1>{fullName}</h1>
            <p className={styles.username}>@{user?.username || 'unknown'}</p>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={onLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </section>

        <section className={styles.activityCard}>
          <div className={styles.sectionHead}>
            <h2>Your Activity</h2>
            <p>Posts and comments</p>
          </div>

          {loading && <p className={styles.placeholder}>Loading activity...</p>}
          {error && !loading && <p className={styles.error}>{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className={styles.placeholder}>No posts or comments yet.</p>
          )}

          <div className={styles.activityList}>
            {items.map((item) => {
              const isComment = Boolean(item?.isComment);
              const parentPostId = item?.parentPostId?._id || item?.parentPostId;
              const parentText = item?.parentPostId?.text;
              const liked = isLikedByCurrentUser(item);
              const likeCount = Array.isArray(item?.likes) ? item.likes.length : 0;

              return (
                <article className={styles.activityItem} key={item?._id}>
                  <div className={styles.badgeRow}>
                    <span className={isComment ? styles.commentBadge : styles.postBadge}>
                      {isComment ? <CommentIcon fontSize="inherit" /> : <PostIcon fontSize="inherit" />}
                      {isComment ? 'Comment' : 'Post'}
                    </span>
                  </div>

                  {isComment && parentPostId && (
                    <Link href={`/thread/${parentPostId}`} className={styles.parentLink}>
                      Original post:{' '}
                      {parentText?.trim()?.slice(0, 70) || 'Open thread'}
                    </Link>
                  )}

                  {item?.text && <p className={styles.text}>{item.text}</p>}

                  {Array.isArray(item?.imageUrls) && item.imageUrls.length > 0 && (
                    <Image
                      src={item.imageUrls[0]}
                      alt="Activity image"
                      className={styles.itemImage}
                      width={1200}
                      height={800}
                      sizes="(max-width: 768px) 100vw, 640px"
                    />
                  )}
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
                      onClick={() => onLike(item._id)}
                    >
                      {liked ? <LikedIcon fontSize="small" /> : <LikeIcon fontSize="small" />}
                      {liked ? `Liked (${likeCount})` : `Like (${likeCount})`}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <nav className={styles.bottomNav}>
        <Link href="/" className={styles.navItemLink}>
          <span className={styles.navItem}>
            <HomeIcon fontSize="small" />
            Home
          </span>
        </Link>
        <Link
          href={isAuthenticated ? '/?compose=true' : loginUrlWithRedirect(pathname || '/profile')}
          className={styles.navItemLink}
        >
          <span className={styles.navItem}>
            <AddIcon fontSize="small" />
          </span>
        </Link>
        <Link href="/profile" className={styles.navItemLink}>
          <span className={styles.navItem}>
            <ProfileIcon fontSize="small" />
            Profile
          </span>
        </Link>
      </nav>
    </div>
  );
}
