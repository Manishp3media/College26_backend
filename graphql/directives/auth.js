import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { GraphQLError } from "graphql";

// Directive definition
export const authDirectiveTypeDefs = `
  directive @auth(
    roles: [String]
    public: Boolean = false
  ) on FIELD_DEFINITION
`;

export function authDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];
      
      if (authDirective) {
        const { resolve: originalResolve } = fieldConfig;
        const { roles, public: isPublic } = authDirective;

        fieldConfig.resolve = async function (source, args, context, info) {
          // Skip auth check if endpoint is marked as public
          if (isPublic) {
            return originalResolve.call(this, source, args, context, info);
          }

          // Perform authentication check
          if (!context.isAuthenticated) {
            throw new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' }
            });
          }

          // Perform authorization check if roles are specified
          if (roles?.length > 0) {
            const userRole = context.user.role;
            if (!roles.includes(userRole)) {
              throw new GraphQLError('Not authorized', {
                extensions: { code: 'FORBIDDEN' }
              });
            }
          }

          return originalResolve.call(this, source, args, context, info);
        };
      }

      return fieldConfig;
    },
  });
}
