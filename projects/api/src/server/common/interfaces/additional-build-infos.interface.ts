import {DeploymentType} from "../../modules/container/enums/deployment-type.enum";

export interface AdditionalBuildInfos {
  callbackUrl?: string;
  deploymentType?: DeploymentType;
  currentVersion?: string;
  targetVersion?: string;
}
