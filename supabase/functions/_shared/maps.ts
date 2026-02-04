/**
 * Generates a Google Maps link for an address
 * If coordinates are available, uses them for more precise navigation
 */
export function getGoogleMapsLink(
  address: string,
  coords?: { lat: number; lng: number } | null
): string {
  if (coords && coords.lat && coords.lng) {
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Creates a clickable Google Maps link HTML for emails
 */
export function getGoogleMapsHtmlLink(
  address: string,
  coords?: { lat: number; lng: number } | null,
  linkText?: string
): string {
  const url = getGoogleMapsLink(address, coords);
  const displayText = linkText || address;
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${displayText} 📍</a>`;
}

/**
 * Creates a clickable Google Maps link for WhatsApp messages
 */
export function getGoogleMapsWhatsAppLink(
  address: string,
  coords?: { lat: number; lng: number } | null
): string {
  const url = getGoogleMapsLink(address, coords);
  return `${address}\n📍 ${url}`;
}
