/**
 * Utility Helper Functions
 */

// Generate a random ID
const generateId = (prefix = 'ID', length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
};

// Format date to ISO string
const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
};

// Format date for display
const formatDateDisplay = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Parse boolean from string
const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
};

// Sanitize string input
const sanitizeString = (str) => {
    if (!str) return null;
    return str.trim().replace(/\s+/g, ' ');
};

// Paginate array
const paginate = (array, page = 1, limit = 20) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
        data: array.slice(startIndex, endIndex),
        pagination: {
            page,
            limit,
            total: array.length,
            totalPages: Math.ceil(array.length / limit)
        }
    };
};

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function for API calls
const retry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(delay);
        }
    }
};

// Extract OT location from message
const extractOTLocation = (message) => {
    if (!message) return null;

    // Patterns: OT 3, OT3, Ot no 2, OT-1, OT No 4
    const patterns = [
        /OT\s*No\.?\s*(\d+)/i,      // OT No 4, Ot no. 2
        /OT\s*-?\s*(\d+)/i,         // OT 3, OT-1, OT3
        /(\d+)\s*no\.?\s*ot/i       // 2 no ot, 3rd no ot
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            return `OT ${match[1]}`;
        }
    }

    // Named locations
    const namedLocations = ['Gaynac OT', 'Cath Lab', 'ICU', 'Ward', 'Lobby'];
    for (const loc of namedLocations) {
        if (message.toLowerCase().includes(loc.toLowerCase())) {
            return loc;
        }
    }

    return null;
};

// Extract temperature from message
const extractTemperature = (message) => {
    if (!message) return null;

    // Patterns: AC 22, temp 18, keep 20
    const patterns = [
        /(?:AC|ac|temp|Temp|keep|Keep|maintain)\s*(\d{2})/i,
        /(\d{2})\s*(?:°C|degree|deg)/i
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            const temp = parseInt(match[1]);
            if (temp >= 16 && temp <= 30) {
                return temp;
            }
        }
    }

    return null;
};

module.exports = {
    generateId,
    formatDate,
    formatDateDisplay,
    parseBoolean,
    sanitizeString,
    paginate,
    sleep,
    retry,
    extractOTLocation,
    extractTemperature
};
