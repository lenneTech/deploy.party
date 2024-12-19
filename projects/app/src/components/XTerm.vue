<script setup lang="ts">
import type { Socket } from 'socket.io-client';

import { ClipboardAddon } from '@xterm/addon-clipboard';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { Buffer } from 'buffer';
import io from 'socket.io-client';

const props = defineProps<{
  containerId: string;
}>();

const { accessTokenState } = useAuthState();
const { terminalHost } = useRuntimeConfig().public;
const terminalContainer = ref<HTMLDivElement | null>(null);
let terminal: Terminal | null = null;
let socket: Socket<any> | null = null;
let fitAddon: FitAddon;

onMounted(() => {
  if (import.meta.server) {
    return;
  }

  fitAddon = new FitAddon();
  const clipboardAddon = new ClipboardAddon();

  terminal = new Terminal({
    allowProposedApi: true,
    cursorBlink: true,
    cursorStyle: 'bar',
    fontFamily: '"Menlo for Powerline", Menlo, Consolas, "Liberation Mono", Courier, monospace',
    fontSize: 13,
    theme: {
      background: '#282a36',
      black: '#000000',
      blue: '#bd93f9',
      brightBlack: '#4d4d4d',
      brightBlue: '#d6acff',
      brightCyan: '#a4ffff',
      brightGreen: '#69ff94',
      brightMagenta: '#ff92d0',
      brightRed: '#ff6e6e',
      brightWhite: '#ffffff',
      brightYellow: '#ffffa5',
      cursor: '#ffb86c',
      cyan: '#8be9fd',
      foreground: '#f8f8f2',
      green: '#50fa7b',
      magenta: '#ff79c6',
      red: '#ff5555',
      selection: '#44475a',
      white: '#bbbbbb',
      yellow: '#f1fa8c',
    },
  });

  terminal.loadAddon(fitAddon);
  terminal.loadAddon(clipboardAddon);

  terminal.open(terminalContainer.value as HTMLDivElement);
  fitAddon.fit();

  socket = io(terminalHost, {
    extraHeaders: {
      Authorization: `Bearer ${accessTokenState.value}`,
    },
  });

  // Terminal starten
  socket.emit('startTerminal', { containerId: props.containerId });

  // Terminal-Ausgabe empfangen
  socket.on('terminalOutput', (data: any) => {
    if (terminal) {
      let textData = Buffer.from(data).toString('utf-8');

      // Entferne Escape-Sequenzen
      textData = textData.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      textData = textData.replace(/\ufffd/g, '');

      terminal.write(textData);
    }
  });

  // Terminal-Eingaben weiterleiten
  terminal.onData((data) => {
    socket!.emit('terminalInput', data);
  });

  socket.on('terminalError', (error: any) => {
    console.error('Terminal Error:', error);
  });

  socket.on('terminalClosed', () => {
    console.debug('Terminal geschlossen');
  });

  window.addEventListener('resize', resizeTerminal);
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }

  if (terminal) {
    terminal.dispose();
  }

  window.removeEventListener('resize', () => resizeTerminal);
});

function resizeTerminal() {
  fitAddon.fit();
}
</script>

<template>
  <div ref="terminalContainer" class="bg-black w-full h-full font-mono"></div>
</template>
