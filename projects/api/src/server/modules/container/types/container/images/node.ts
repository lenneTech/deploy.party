import {Container} from "../../../container.model";
import {Build} from "../../../../build/build.model";
import {buildNodeHealthcheck} from "./node-healthcheck.helper";

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
  // DEV-4068: every NODE container gets a healthcheck (its own healthCheckCmd, otherwise a TCP check
  // on its port), so Swarm only replaces the old version once the new one actually listens.
  const healthcheck = buildNodeHealthcheck(container);
  if (healthcheck) {
    Dockerfile.push(healthcheck);
  }
  Dockerfile.push(`EXPOSE ${container.port}`);

  if (container.startCmd) {
    Dockerfile.push(`CMD ${container.startCmd}`);
  }

  return Dockerfile.join('\n');
}
