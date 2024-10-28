import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

export const createContext = async ({ req, redisClient }) => {
    const context = {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        redisClient
    };

    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            context.user = decoded;
            context.isAuthenticated = true;
            context.isAdmin = decoded.role === "admin";
        } catch (error) {
            throw new GraphQLError("Invalid token", {
                extensions: {
                    code: "UNAUTHENTICATED"
                }
            });
        }
    }

    return context;
};