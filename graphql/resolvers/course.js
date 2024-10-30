import { GraphQLError } from "graphql";
import Course from "../../models/Course.js";
import { CACHE_KEYS, CACHE_TTL } from "../../constants/cache.js";
import { storageService } from "../../utils/storage.js";
import { addCourseValidationShema } from "../../validations/course.js";

const resolvers = {
  Query: {
    getCourses: async (_, __, { redisClient, isAdmin }) => {
      try {
        // Check authentication
        if (!isAdmin) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const cached = await redisClient.get(CACHE_KEYS.COURSES.ALL);

        if (cached) {
          return JSON.parse(cached);
        }

        // Get all placement partners
        const courses = await Course.find();

        await redisClient.setEx(
          CACHE_KEYS.COURSES.ALL,
          CACHE_TTL.MEDIUM,
          JSON.stringify(courses));

        return courses;
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    }
  },

  Mutation: {
    addCourse: async (_, {
      courseName,
      courseShortName,
      duration,
      certificate,
      eligibility,
      courseType,
      academicLevel,
      stream,
      admissionOpen,
      digitalLearningSupport
    }, { isAdmin, redisClient }) => {

      try {
        if (!isAdmin) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        // Validate input
        const validation = addCourseValidationShema.safeParse({
          courseName,
          courseShortName,
          duration,
          eligibility,
          courseType,
          academicLevel,
          stream,
          admissionOpen,
          digitalLearningSupport
        });

        if (!validation.success) {
          throw new GraphQLError('Invalid input', {
            extensions: {
              code: 'BAD_USER_INPUT',
              errors: validation.error.flatten().fieldErrors,
            },
          });
        }

        const lowerCaseCourseName = courseName.toLowerCase();
        const lowerCaseCourseShortName = courseShortName.toLowerCase();

        const existingCourse = await Course.findOne({
          $or: [
            { courseName: lowerCaseCourseName },
            { courseShortName: lowerCaseCourseShortName }
          ]
        });

        if (existingCourse) {
          throw new GraphQLError('Course already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Handle file upload similar to placement partner
        const upload = await certificate;

        if (!upload) {
          throw new GraphQLError('Certificate upload failed');
        }

        const certificateUrl = await storageService.saveImage(upload, 'course');

        const course = new Course({
          courseName: lowerCaseCourseName,
          courseShortName: lowerCaseCourseShortName,
          duration,
          certificate: certificateUrl,
          eligibility,
          courseType,
          academicLevel,
          stream,
          admissionOpen,
          digitalLearningSupport
        });

        await course.save();
        await redisClient.del(CACHE_KEYS.COURSES.ALL);

        return course;
      } catch (error) {
        console.error('Error in addCourse:', error);
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    updateCourse: async (_, { id, ...updatedFields }, { isAdmin, redisClient }) => {
      try {
        if (!isAdmin) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const existingCourse = await Course.findById(id);
        if (!existingCourse) {
          throw new GraphQLError('Course not found', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Handle certificate upload if it's updated
        if (updatedFields.certificate) {
          const upload = await updatedFields.certificate;
          if (!upload) {
            throw new GraphQLError('Certificate upload failed');
          }
          updatedFields.certificate = await storageService.saveImage(upload, 'course');
        }

        Object.assign(existingCourse, updatedFields); // Update the course fields
        await existingCourse.save();

        await redisClient.del(CACHE_KEYS.COURSES.ALL); // Clear cache
        return existingCourse;
      } catch (error) {
        console.error('Error in updateCourse:', error);
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    deleteCourse: async (_, { id }, { isAdmin, redisClient }) => {
      try {
        if (!isAdmin) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const deletedCourse = await Course.findByIdAndDelete(id);
        if (!deletedCourse) {
          throw new GraphQLError('Course not found', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        await redisClient.del(CACHE_KEYS.COURSES.ALL); // Clear cache
        return deletedCourse;
      } catch (error) {
        console.error('Error in deleteCourse:', error);
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    }
  }
};

export default resolvers;