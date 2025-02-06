import {Container} from "../../../container.model";
import {Build} from "../../../../build/build.model";

export async function getStaticImage(container: Container, build?: Build): Promise<string> {
  const Dockerfile: Array<string> = [];
  Dockerfile.push(`FROM nginx:alpine`);
  Dockerfile.push(`LABEL deploy.party.id=${container.id}`);

  if (build) {
    Dockerfile.push(`LABEL deploy.party.build.id=${build.id}`);
  }

  Dockerfile.push('RUN rm /usr/share/nginx/html/index.html');
  Dockerfile.push('WORKDIR /usr/share/nginx/html');

  Dockerfile.push(`RUN mkdir -p /tmp/code`);
  Dockerfile.push(`COPY ./code/${container.baseDir || ''} /tmp/code`);
  Dockerfile.push(`WORKDIR /tmp/code`);

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

  Dockerfile.push(`RUN cp -r /tmp/code/${container.baseDir}/* /usr/share/nginx/html`);
  Dockerfile.push(`RUN rm -rf /tmp/code`);
  Dockerfile.push(`WORKDIR /usr/share/nginx/html`);

  Dockerfile.push('RUN rm -rf .git');
  if (container.healthCheckCmd) {
    Dockerfile.push('RUN apk --no-cache add curl');
    Dockerfile.push(
      `HEALTHCHECK --interval=5s --retries=60 CMD ${container.healthCheckCmd} || exit 1`
    );
  }

  return Dockerfile.join('\n');
}
