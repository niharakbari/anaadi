/**
 * Centralized API client wrapper around native fetch.
 * Intercepts 401 Unauthorized responses to dispatch global session events.
 */
export async function apiClient(url, options = {}) {
  // Always include credentials unless explicitly overridden
  const finalOptions = {
    ...options,
    credentials: options.credentials || 'include',
  };

  const response = await fetch(url, finalOptions);

  if (response.status === 401) {
    try {
      // Clone response so the caller can still read the original if needed
      const cloned = response.clone();
      const data = await cloned.json();
      
      if (data.code === 'TOKEN_EXPIRED') {
        window.dispatchEvent(new CustomEvent('session_expired'));
      } else if (data.code === 'MISSING_TOKEN' || data.code === 'INVALID_TOKEN') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
    } catch (e) {
      // If parsing fails or it's not JSON, fallback to generic unauthorized
      window.dispatchEvent(new CustomEvent('unauthorized'));
    }
  }

  return response;
}
