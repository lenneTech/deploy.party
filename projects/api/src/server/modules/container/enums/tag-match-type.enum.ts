import {registerEnumType} from '@nestjs/graphql';

export enum TagMatchType {
  EXACT = 'EXACT',
  PATTERN = 'PATTERN'
}

registerEnumType(TagMatchType, {
  name: 'TagMatchType',
  description: 'Tag matching type for deployment configuration'
});