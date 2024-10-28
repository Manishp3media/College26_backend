import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { GraphQLError } from "graphql";

import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { GraphQLError } from 'graphql';

export function authDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];
      
      if (authDirective) {
        const { resolve: originalResolve } = fieldConfig;
        
        fieldConfig.resolve = async function (source, args, context, info) {
          if (!context.isAuthenticated) {
            throw new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' }
            });
          }

          const { roles } = authDirective;
          if (roles) {
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