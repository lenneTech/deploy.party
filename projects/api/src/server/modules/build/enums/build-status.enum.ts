import {registerEnumType} from "@nestjs/graphql";

export enum BuildStatus {
    QUEUE = "QUEUE",
    SKIPPED = "SKIPPED",
    RUNNING = "RUNNING",
    CANCEL = "CANCEL",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
}

registerEnumType(BuildStatus, {
    name: "BuildStatus",
    description: "Status of Build",
});
