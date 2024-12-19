import {registerEnumType} from "@nestjs/graphql";

export enum ContainerStatus {
    DRAFT = "DRAFT",
    DEPLOYED = "DEPLOYED",
    DIED = "DIED",
    BUILDING = "BUILDING",
    RESTORING = "RESTORING",
    STOPPED = "STOPPED",
    STOPPED_BY_SYSTEM = "STOPPED_BY_SYSTEM",
}

registerEnumType(ContainerStatus, {
    name: "ContainerStatus",
    description: "Status of Container",
});
