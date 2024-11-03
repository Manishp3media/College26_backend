import User from "../../models/User.js"; // Make sure this path is correct
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import { adminValidationSchema } from "../../validations/auth.js";

const adminResolvers = {
  Mutation: {
    adminSignup: async (_, { input }) => {
      // Validate input using Zod schema
      const validation = adminValidationSchema.safeParse(input);
      if (!validation.success) {
        throw new GraphQLError('Invalid input', {
          extensions: {
            code: 'BAD_USER_INPUT',
            errors: validation.error.flatten().fieldErrors,
          },
        });
      }

      try {
        const { email, password } = validation.data;

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email, role: "admin" });
        if (existingAdmin) {
          throw new GraphQLError('Admin account already exists', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const admin = new User({
          email,
          password: hashedPassword,
          role: "admin"
        });

        // Save the admin
        await admin.save();

        // Generate token
        const token = jwt.sign(
          { _id: admin._id, role: admin.role },
          process.env.JWT_SECRET
        );

        return {
          token,
          user: admin
        };
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    adminSignin: async (_, { input }) => {
      // Validate input using Zod schema
      const validation = adminValidationSchema.safeParse(input);
      if (!validation.success) {
        throw new GraphQLError('Invalid input', {
          extensions: {
            code: 'BAD_USER_INPUT',
            errors: validation.error.flatten().fieldErrors,
          },
        });
      }

      try {
        const { email, password } = validation.data;

        // Check if admin exists
        const admin = await User.findOne({ email, role: "admin" });
        if (!admin) {
          throw new GraphQLError('Admin not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
          throw new GraphQLError('Invalid credentials', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Generate token
        const token = jwt.sign(
          { _id: admin._id, role: admin.role },
          process.env.JWT_SECRET
        );

        return {
          token,
          user: admin
        };
      } catch (error) {
        console.log(error);
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
};

export default adminResolvers;