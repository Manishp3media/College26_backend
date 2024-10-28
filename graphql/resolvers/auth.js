import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import User from '../../models/User.js';
import { userSigninSchema, userSignupSchema } from '../../validations/auth.js';

const resolvers = {
    Mutation: {
      signup: async (_, { input }) => {
        // Zod validation for signup input
        const validation = userSignupSchema.safeParse(input);
        if (!validation.success) {
          throw new GraphQLError('Invalid input', {
            extensions: {
              code: 'BAD_USER_INPUT',
              errors: validation.error.flatten().fieldErrors,
            },
          });
        }
        
        try {
          const { fullName, mobileNumber, email, gender, dob, country, state, city, qualification } = validation.data;
  
          // Check if user exists
          const existingUser = await User.findOne({
            $or: [{ mobileNumber }, { email }],
            role: "user"
          });
  
          if (existingUser) {
            throw new GraphQLError('User already exists', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }
  
          const user = new User({
            fullName,
            mobileNumber,
            email,
            gender,
            dob,
            country,
            state,
            city,
            qualification,
            role: "user"
          });
  
          // Save user
          await user.save();
  
          // Generate token
          const token = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET
          );
  
          return {
            token,
            user
          };
        } catch (error) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      },
  
      signin: async (_, { input }) => {
        // Zod validation for signin input
        const validation = userSigninSchema.safeParse(input);
        if (!validation.success) {
          throw new GraphQLError('Invalid input', {
            extensions: {
              code: 'BAD_USER_INPUT',
              errors: validation.error.flatten().fieldErrors,
            },
          });
        }
        
        try {
          const { mobileNumber } = validation.data;
  
          // Check if user exists
          const user = await User.findOne({ mobileNumber });
  
          if (!user) {
            throw new GraphQLError('User not found', {
              extensions: { code: 'NOT_FOUND' }
            });
          }
  
          // Generate token
          const token = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET
          );
  
          return {
            token,
            user
          };
        } catch (error) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      }
    }
  };
  
  export default resolvers;