/**
 * Returns the production base URL for embed codes and external links.
 * Always returns the custom domain (sribooking.com) to ensure partners
 * get correct embed codes regardless of where they access the dashboard.
 */
const PRODUCTION_URL = 'https://sribooking.com';

export const getProductionBaseUrl = (): string => {
  const origin = window.location.origin;

  // If already on the production custom domain, use it directly
  if (origin.includes('sribooking.com')) {
    return origin;
  }

  // For preview URLs or lovable.app staging, use the production custom domain
  if (origin.includes('lovable.app')) {
    return PRODUCTION_URL;
  }

  // Fallback: use current origin (e.g., localhost for dev)
  return origin;
};
