// HTML sanitization utility to prevent XSS attacks
// This removes all HTML tags and only keeps plain text

export function sanitizeHTML(text: string): string {
  if (!text) return '';
  
  // Create a temporary DOM element to decode HTML entities
  const temp = document.createElement('div');
  temp.textContent = text;
  const decoded = temp.innerHTML;
  
  // Remove all HTML tags
  return decoded.replace(/<[^>]*>/g, '');
}

// For displaying user-generated content safely
export function escapeHTML(text: string): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}
