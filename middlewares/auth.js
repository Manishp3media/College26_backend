import jwt from "jsonwebtoken";

const authMiddleware = (requiredRole) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            // Check if the user has the correct role
            if (decoded.role !== requiredRole) {
                return res.status(403).send('Forbidden: Insufficient permissions');
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
};

export default authMiddleware;