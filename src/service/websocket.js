let ws;

export function connectWebSocket(onMessage) {
    ws = new WebSocket('wss://apigymcloud.aplus-security.com/ws/');

    ws.onopen = () => {
        console.log('🟢 WS conectado (frontend)');

        ws.send(
            JSON.stringify({
                type: 'REGISTER_FRONTEND'
            })
        );
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📥 WS frontend:', data);

        if (onMessage) {
            onMessage(data);
        }
    };

    ws.onclose = () => {
        console.log('🔴 WS desconectado, reconectando...');
        setTimeout(() => connectWebSocket(onMessage), 5000);
    };

    ws.onerror = (err) => {
        console.error('❌ WS error:', err);
    };
}
