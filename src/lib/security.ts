import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML to prevent XSS attacks
export function sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
    });
}

// Escape special characters for safe display
export function escapeHTML(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

// Validate and sanitize user input
export function sanitizeInput(input: string): string {
    // First sanitize HTML
    let cleaned = sanitizeHTML(input);

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
}
