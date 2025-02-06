import {Container} from "../../../container.model";
import {Build} from "../../../../build/build.model";

export async function getNodeImage(container: Container, build?: Build): Promise<string> {
  const Dockerfile: Array<string> = [];
  Dockerfile.push(`FROM ${container.buildImage}`);
  Dockerfile.push(`LABEL deploy.party.id=${container.id}`);

  if (build) {
    Dockerfile.push(`LABEL deploy.party.build.id=${build.id}`);
  }

  Dockerfile.push('WORKDIR /app');
  Dockerfile.push(`COPY ./code/${container.baseDir || ''} ./`);

  if (container.customImageCommands) {
    const customImageCommands = container.customImageCommands.split('\n');
    for (const command of customImageCommands) {
      Dockerfile.push(`${command}`);
    }
  }

  if (container.installCmd) {
    Dockerfile.push(`RUN ${container.installCmd}`);
  }

  if (container.buildCmd) {
    Dockerfile.push(`RUN ${container.buildCmd}`);
  }


  Dockerfile.push('RUN rm -rf .git');
  if (container.healthCheckCmd) {
    Dockerfile.push(
      `HEALTHCHECK --interval=5s --retries=60 CMD ${container.healthCheckCmd} || exit 1`
    );
  }
  Dockerfile.push(`EXPOSE ${container.port}`);

  if (container.startCmd) {
    Dockerfile.push(`CMD ${container.startCmd}`);
  }

  return Dockerfile.join('\n');
}
