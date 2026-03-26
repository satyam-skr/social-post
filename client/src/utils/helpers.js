// Format date to relative time (e.g., "2 hours ago")
export const formatTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const secondsAgo = Math.floor((now - new Date(date)) / 1000);

  if (secondsAgo < 60) return 'now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
  
  return new Date(date).toLocaleDateString();
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Format numbers (1000 -> 1K)
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

export default {
  formatTimeAgo,
  truncateText,
  formatNumber,
};
