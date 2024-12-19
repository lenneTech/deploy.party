import {Injectable} from "@nestjs/common";
import {exec} from "child_process";
import {execa} from "execa";

@Injectable()
export class SystemService {

  systemUpdatesAvailable() {
    return new Promise((resolve, reject) => {
      exec('apt update', (error, stdout, stderr) => {
        console.debug(error, stdout);
        if (error) {
          resolve(false);
          return;
        }

        // Überprüfe die Ausgabe nach Informationen über verfügbare Updates
        if (stdout.includes('0 aktualisiert, 0 neu installiert')) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async getTraefikVersion() {
    const {stdout: ids} = await execa(
      `docker ps -a --filter 'label=com.docker.stack.namespace=traefik' --format {{.ID}}`,
      {shell: true}
    );

    const idsArray = ids.split('\n');
    const id = idsArray.length ? idsArray[0] : null;

    console.debug('id', id);
    if (!id) {
      return null;
    }

    const {stdout} = await execa(`docker inspect --format='{{json .Config.Labels.org.opencontainers.image.version}}' ${id}`, {
      shell: true,
    });

    return stdout.replace(/"/g, '');
  }
}
