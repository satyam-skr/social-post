'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { loginUrlWithRedirect } from '@/utils/authRedirect';
import styles from '../profile.module.css';
import { userAPI } from '@/services/api';
import { togglePostLike } from '@/redux/slices/postsSlice';
import {
  Home as HomeIcon,
  AddCircleOutline as AddIcon,
  PersonOutline as ProfileIcon,
  Favorite as LikedIcon,
  FavoriteBorder as LikeIcon,
  ArticleOutlined as PostIcon,
} from '@mui/icons-material';

const FALLBACK_AVATAR = 'https://i.pravatar.cc/120?img=25';

export default function UserProfilePage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const routeParams = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usernameParam = routeParams?.username;

  const fullName = useMemo(() => {
    const first = profileUser?.firstName || '';
    const last = profileUser?.lastName || '';
    return `${first} ${last}`.trim() || 'Unknown User';
  }, [profileUser?.firstName, profileUser?.lastName]);

  const profileImage = profileUser?.avatar || FALLBACK_AVATAR;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(loginUrlWithRedirect(`/profile/${usernameParam || ''}`));
    }
  }, [isAuthenticated, router, usernameParam]);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      if (!isAuthenticated || !usernameParam) return;
      setLoading(true);
      setError('');

      try {
        const profileResponse = await userAPI.getProfileByUsername(usernameParam);
        const profilePayload = profileResponse?.data ?? profileResponse;
        const selectedUser = profilePayload?.data ?? profilePayload?.user ?? profilePayload;

        if (!selectedUser?._id) {
          throw new Error('User profile not found');
        }

        const postsResponse = await userAPI.getUserPosts({ userId: selectedUser._id, page: 1, limit: 50, isComment: false });
        const postsPayload = postsResponse?.data ?? postsResponse;
        const list = postsPayload?.data ?? postsPayload?.posts ?? [];

        if (!ignore) {
          setProfileUser(selectedUser);
          setItems(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!ignore) {
          setProfileUser(null);
          setItems([]);
          setError(err?.message || 'Failed to load user profile');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, usernameParam]);

  if (!isAuthenticated) {
    return (
      <main className={styles.redirectWrap}>
        <h1>Profile</h1>
        <p>Redirecting to login...</p>
        <p><Link href={loginUrlWithRedirect(`/profile/${usernameParam || ''}`)}>Go to login</Link></p>
      </main>
    );
  }

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
            alt={`${profileUser?.username || 'user'} avatar`}
            className={styles.avatar}
            width={120}
            height={120}
          />
          <div className={styles.profileMeta}>
            <h1>{fullName}</h1>
            <p className={styles.username}>@{profileUser?.username || usernameParam || 'unknown'}</p>
          </div>
        </section>

        <section className={styles.activityCard}>
          <div className={styles.sectionHead}>
            <h2>{profileUser?.username ? `${profileUser.username}'s Posts` : 'User Posts'}</h2>
            <p>All posts by this user</p>
          </div>

          {loading && <p className={styles.placeholder}>Loading activity...</p>}
          {error && !loading && <p className={styles.error}>{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className={styles.placeholder}>No posts yet.</p>
          )}

          <div className={styles.activityList}>
            {items.map((item) => {
              const liked = isLikedByCurrentUser(item);
              const likeCount = Array.isArray(item?.likes) ? item.likes.length : 0;
              return (
                <article className={styles.activityItem} key={item?._id}>
                  <div className={styles.badgeRow}>
                    <span className={styles.postBadge}>
                      <PostIcon fontSize="inherit" />
                      Post
                    </span>
                  </div>

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
