export default defineNuxtPlugin(() => {
  return {
    provide: {
      copyToClipboard(text: number | string) {
        const textarea = document.createElement('textarea');
        textarea.value = text.toString();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      },
    },
  };
});
