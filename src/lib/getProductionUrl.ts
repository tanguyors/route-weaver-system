/**
 * Returns the production base URL for embed codes and external links.
 * In preview environments, maps to the published URL.
 * This ensures partners always get embed codes pointing to the production domain.
 */
export const getProductionBaseUrl = (): string => {
  const origin = window.location.origin;

  // Detect Lovable preview URLs (pattern: id-preview--{uuid}.lovable.app)
  if (origin.includes('id-preview--')) {
    return 'https://route-weaver-system.lovable.app';
  }

  // In production or custom domain, use current origin
  return origin;
};
