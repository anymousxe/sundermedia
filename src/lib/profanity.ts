// Advanced profanity filter - blocks severe harmful content, allows general cussing
const SEVERE_WORDS = [
    // Hate speech patterns (these are blocked)
    'ihate', 'kill', 'die', 'hitler', 'nazi', 'kkk',
    // Severe slurs (blocked - using partial patterns to avoid listing explicit terms)
    'fag', 'dyke', 'tranny',
    // Sexual/predatory content (blocked)
    'rape', 'molest', 'pedo', 'loli', 'shota',
    // Political figures (blocked to avoid toxicity)
    'trump', 'biden', 'obama', 'putin',
];

// Leet speak mappings
const LEET_SPEAK_MAP: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i',
};

// Normalize text by converting leet speak and removing special characters
function normalizeText(text: string): string {
    let normalized = text.toLowerCase();

    // Convert leet speak
    Object.entries(LEET_SPEAK_MAP).forEach(([leet, normal]) => {
        normalized = normalized.replace(new RegExp(leet, 'g'), normal);
    });

    // Remove special characters but keep letters
    normalized = normalized.replace(/[^a-z]/g, '');

    // Remove repeated characters (e.g., "fuuuuck" -> "fuck")
    normalized = normalized.replace(/(.)\1{2,}/g, '$1');

    return normalized;
}

// Check if text contains severe harmful content
export function containsSevereContent(text: string): boolean {
    const normalized = normalizeText(text);

    // Check for hate speech patterns
    for (const word of SEVERE_WORDS) {
        if (normalized.includes(word)) {
            return true;
        }
    }

    // Check for "ihate[group]" patterns
    if (normalized.match(/ihate[a-z]+/) || normalized.match(/hate[a-z]+s$/)) {
        return true;
    }

    return false;
}

// Get user-friendly error message
export function getProfanityError(text: string): string | null {
    if (containsSevereContent(text)) {
        return 'This content contains harmful or inappropriate language that violates our community guidelines.';
    }
    return null;
}

// Validate text (username, bio, post content)
export function validateContent(text: string): { valid: boolean; error?: string } {
    const error = getProfanityError(text);
    if (error) {
        return { valid: false, error };
    }
    return { valid: true };
}
