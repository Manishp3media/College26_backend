export const CACHE_KEYS = {
    STREAMS: {
        ALL: 'cache:streams:all',
        BY_ID: (id) => `cache:streams:${id}`,
    },
    ACCREDITATION: {
        ALL: 'cache:accreditation:all',
        BY_ID: (id) => `cache:accreditation:${id}`,
    },
    AMENITIES: {
        ALL: 'cache:amenities:all',
        BY_ID: (id) => `cache:amenities:${id}`,
    },
    PLACEMENT_PARTNERS: {
        ALL: 'cache:placement_partners:all',
        BY_ID: (id) => `cache:placement_partners:${id}`,
    },
    SOCIAL_MEDIA: {
        ALL: 'cache:social_media:all',
        BY_ID: (id) => `cache:social_media:${id}`,
    },
    USERS: {
        BY_ID: (id) => `cache:users:${id}`,
        BY_EMAIL: (email) => `cache:users:email:${email}`,
    },
    ACADEMIC_LEVEL: {
        ALL: 'cache:academic_level:all',
        BY_ID: (id) => `cache:academic_level:${id}`,
    },
    COURSES: {
        ALL: 'cache:courses:all',
        BY_ID: (id) => `cache:courses:${id}`,
    }
};

export const CACHE_TTL = {
    SHORT: 300,      // 5 minutes
    MEDIUM: 1800,    // 30 minutes
    LONG: 3600,      // 1 hour
    VERY_LONG: 86400 // 24 hours
};