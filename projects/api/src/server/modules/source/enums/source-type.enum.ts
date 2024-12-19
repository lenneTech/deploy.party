import { registerEnumType } from "@nestjs/graphql";

export enum SourceType {
    GITLAB = "GITLAB",
    GITHUB = "GITHUB"
}

registerEnumType(SourceType, {
  name: 'SourceType',
  description: 'Type of Source',
});
