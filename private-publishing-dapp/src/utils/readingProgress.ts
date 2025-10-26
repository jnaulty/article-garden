/**
 * Reading Progress Utilities
 * Manages article reading progress in localStorage
 */

const STORAGE_PREFIX = 'article-progress-';
const STORAGE_READ_PREFIX = 'article-read-';
const STORAGE_TIME_PREFIX = 'article-time-';
const READ_THRESHOLD = 90; // Consider 90%+ as "read"

/**
 * Get reading progress for an article (0-100)
 */
export function getReadingProgress(articleId: string): number {
  const key = `${STORAGE_PREFIX}${articleId}`;
  const value = localStorage.getItem(key);
  return value ? parseInt(value, 10) : 0;
}

/**
 * Save reading progress for an article
 * @param articleId - The article ID
 * @param progress - Progress percentage (0-100)
 */
export function saveReadingProgress(
  articleId: string,
  progress: number
): void {
  const key = `${STORAGE_PREFIX}${articleId}`;
  const normalized = Math.max(0, Math.min(100, Math.round(progress)));
  localStorage.setItem(key, normalized.toString());

  // Auto-mark as read if threshold reached
  if (normalized >= READ_THRESHOLD) {
    markArticleAsRead(articleId);
  }

  // Update last read time
  saveLastReadTime(articleId, Date.now());
}

/**
 * Check if an article has been read
 */
export function isArticleRead(articleId: string): boolean {
  const key = `${STORAGE_READ_PREFIX}${articleId}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * Mark an article as read
 */
export function markArticleAsRead(articleId: string): void {
  const key = `${STORAGE_READ_PREFIX}${articleId}`;
  localStorage.setItem(key, 'true');

  // Set progress directly to avoid circular call
  const progressKey = `${STORAGE_PREFIX}${articleId}`;
  localStorage.setItem(progressKey, '100');

  // Update last read time
  saveLastReadTime(articleId, Date.now());
}

/**
 * Get the last time an article was read
 * @returns Unix timestamp in milliseconds, or undefined if never read
 */
export function getLastReadTime(articleId: string): number | undefined {
  const key = `${STORAGE_TIME_PREFIX}${articleId}`;
  const value = localStorage.getItem(key);
  return value ? parseInt(value, 10) : undefined;
}

/**
 * Save the last read time for an article
 */
export function saveLastReadTime(articleId: string, timestamp: number): void {
  const key = `${STORAGE_TIME_PREFIX}${articleId}`;
  localStorage.setItem(key, timestamp.toString());
}

/**
 * Get all article IDs that have been read
 */
export function getAllReadArticles(): string[] {
  const articles: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_READ_PREFIX)) {
      const articleId = key.replace(STORAGE_READ_PREFIX, '');
      if (isArticleRead(articleId)) {
        articles.push(articleId);
      }
    }
  }
  return articles;
}

/**
 * Clear all reading progress for an article
 */
export function clearReadingProgress(articleId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${articleId}`);
  localStorage.removeItem(`${STORAGE_READ_PREFIX}${articleId}`);
  localStorage.removeItem(`${STORAGE_TIME_PREFIX}${articleId}`);
}

/**
 * Get all articles with reading progress
 */
export function getAllArticlesWithProgress(): Array<{
  articleId: string;
  progress: number;
  isRead: boolean;
  lastReadAt?: number;
}> {
  const articles: Array<{
    articleId: string;
    progress: number;
    isRead: boolean;
    lastReadAt?: number;
  }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const articleId = key.replace(STORAGE_PREFIX, '');
      articles.push({
        articleId,
        progress: getReadingProgress(articleId),
        isRead: isArticleRead(articleId),
        lastReadAt: getLastReadTime(articleId),
      });
    }
  }

  return articles;
}

/**
 * Estimate reading time based on content length
 * @param contentLength - Length of content in characters
 * @returns Estimated reading time in minutes
 */
export function estimateReadTime(contentLength: number): number {
  // Average reading speed: 200 words per minute
  // Average word length: 5 characters
  const words = contentLength / 5;
  return Math.ceil(words / 200) || 1; // Minimum 1 minute
}
