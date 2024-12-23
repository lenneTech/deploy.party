import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {DockerService} from "./server/common/services/docker.service";
import {AuthService} from "./server/modules/auth/auth.service";
import {UserService} from "./server/modules/user/user.service";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Docker = require('dockerode');

@WebSocketGateway(4800, { cors: { origin: '*' } })
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private docker = new Docker();

  constructor(private dockerService: DockerService, private authService: AuthService, private userService: UserService) {
  }

  async handleConnection(client: Socket) {
    if (!client.handshake.headers.authorization) {
      client.disconnect();
      return;
    }

    const token = client.handshake.headers.authorization.replace('Bearer ', '');
    const payload = this.authService.decodeJwt(token);
    if (!payload) {
      client.disconnect();
      return;
    }

    const user = await this.userService.get(payload.id);
    if (!user) {
      client.disconnect();
      return;
    }

    console.debug(`Client connected: ${client.id} - ${user.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('startTerminal')
  async handleStartTerminal(client: Socket, payload: { containerId: string }) {
    const { containerId } = payload;

    try {
      const dockerId = await this.dockerService.getId(containerId);
      const container = this.docker.getContainer(dockerId);

      const execOptions = {
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Cmd: ['/bin/bash'],
        Env: ['TERM=xterm'],
      };

      const exec = await container.exec(execOptions);
      const stream = await exec.start({ hijack: true, stdin: true });

      client.on('terminalInput', (data: string) => {
        stream.write(data);
      });

      stream.on('data', (chunk: Buffer) => {
        const data = chunk.toString('utf-8');

        const stripAnsi = (input) =>
          input.replace(
            /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,
            ''
          );

        const cleanedData = stripAnsi(data);
        client.emit('terminalOutput', cleanedData);
      });

      stream.on('end', () => {
        client.emit('terminalClosed');
        client.disconnect();
      });

      stream.on('error', (error) => {
        client.emit('terminalError', error.message);
      });

      client.emit('terminalStarted');
    } catch (error) {
      client.emit('terminalError', error.message);
    }
  }
}
