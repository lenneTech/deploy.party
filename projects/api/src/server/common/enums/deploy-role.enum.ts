import {registerEnumType} from "@nestjs/graphql";

export enum DeployRoleEnum {
  ADMIN = 'admin',
  OWNER = 'owner',
  MAINTAINER = 'maintainer',
  VIEWER = 'viewer',
}

registerEnumType(DeployRoleEnum, {
  name: "DeployRoleEnum",
  description: "Roles of deploy.party",
});
