import { BASE_URL, getToken } from './config';

/**
 * WebSocket client specifically for global notifications
 */
export class NotificationWebSocketClient {
  constructor(onNotification) {
    this.onNotification = onNotification;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const token = getToken();
    if (!token) {
      console.error('🚫 No token available for notification WebSocket connection');
      return;
    }

    const wsUrl = `${BASE_URL.replace(/^http/, 'ws')}/chat/ws/notifications?token=${token}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('🔔 Connected to notification WebSocket');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('🔔 Received notification:', data);
          this.onNotification(data);
        } catch (error) {
          console.error('❌ Error parsing notification WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        const { code, reason, wasClean } = event;

        console.warn('🔌 Notification WebSocket disconnected');
        console.warn(`   • Code: ${code}`);
        console.warn(`   • Reason: ${reason || 'No reason provided'}`);
        console.warn(`   • Clean: ${wasClean}`);

        // 🔍 More descriptive error decoding
        switch (code) {
          case 1000:
            console.info('✅ Normal closure');
            break;
          case 1006:
            console.warn('❗ Abnormal closure (1006): Likely no `accept()` before close OR handshake failure (e.g., token error)');
            break;
          case 1008:
            console.warn('❗ Policy violation (1008): Server rejected due to invalid or unauthorized token.');
            break;
          case 4401:
            console.warn('❗ Unauthorized (4401): Token missing or invalid.');
            break;
          case 4404:
            console.warn('❗ User not found (4404): User does not exist in DB.');
            break;
          default:
            console.warn(`ℹ️ WebSocket closed with unknown code: ${code}`);
        }

        // 🔄 Attempt reconnect if not clean or normal closure
        if (code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const retryDelay = 2000 * this.reconnectAttempts;
          console.log(`🔄 Attempting to reconnect in ${retryDelay / 1000}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          setTimeout(() => {
            this.connect();
          }, retryDelay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('🚫 Max reconnection attempts reached. Giving up.');
        }
      };

      this.socket.onerror = (error) => {
        console.error('🔥 Notification WebSocket error:', error);
      };
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000); // Normal closure
      this.socket = null;
      console.log('🔌 Notification WebSocket disconnected manually');
    }
  }
}
