import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { apiBaseUrl } from './api';

window.Pusher = Pusher;

export function createEcho() {
  const key = import.meta.env.VITE_REVERB_APP_KEY;

  if (!key) {
    return null;
  }

  return new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST || new URL(apiBaseUrl).hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
  });
}

const echo = createEcho();
export default echo;
