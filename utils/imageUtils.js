export const getImageUrl = (path) => {
    if (!path) return '';
    
    // If it's already a full URL (S3), return as is
    if (path.startsWith('http')) {
      return path;
    }
    
    // For local development
    if (process.env.NODE_ENV === 'development') {
      return `http://localhost:${process.env.PORT || 3000}${path}`;
    }
    
    // For production
    if (process.env.NODE_ENV === 'production') {
      return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
    }
    
    return path;
  };