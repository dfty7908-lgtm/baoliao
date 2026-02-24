import config from './config';


/**
 * WebSocket 连接管理
 * 功能：自动重连、心跳检测、状态管理
 */

class WebSocketManager {
    private socketTask: any = null;
    private url: string = config.wsUrl;
    private userId: number | null = null;
    private reconnectTimer: any = null;
    private heartbeatTimer: any = null;
    private reconnectCount: number = 0;
    private maxReconnectCount: number = 999; // 持续重连，不轻易放弃
    private reconnectInterval: number = 3000; // 初始重连间隔（毫秒）
    private maxReconnectInterval: number = 30000; // 最大重连间隔（30秒）
    private heartbeatInterval: number = 30000; // 心跳间隔 (30秒)
    private isManualClose: boolean = false; // 是否手动关闭
    private isConnected: boolean = false; // 连接状态

    constructor() {
        if (!this.url) {
            console.error('[WebSocket] ERROR: URL is empty! Please check config.ts');
        }
    }

    /**
     * 初始化连接
     */
    connect(userId: number) {
        if (this.isConnected && this.socketTask) {
            return;
        }

        this.userId = userId;
        this.isManualClose = false;
        this.reconnectCount = 0; // 重置重��计数
        this._createConnection();
    }

    /**
     * 确保连接存活，用于 App onShow 时调用
     */
    ensureConnected() {
        if (this.isConnected && this.socketTask) {
            return; // 连接正常，无需操作
        }
        if (this.userId) {
            console.log('[WebSocket] ensureConnected: reconnecting...');
            this.reconnectCount = 0;
            this.isManualClose = false;
            this._createConnection();
        }
    }

    /**
     * 创建 WebSocket 连接
     */
    private _createConnection() {
        console.log(`[WebSocket] Connecting to ${this.url}...`);

        this.socketTask = uni.connectSocket({
            url: this.url,
            success: () => {
                // Connection request accepted by runtime
            },
            fail: (err: any) => {
                console.error('[WebSocket] Connection failed:', err);
                this._handleReconnect();
            }
        });

        this.socketTask.onOpen(() => {
            console.log('[WebSocket] Event: onOpen - Connection established');
            this.isConnected = true;
            this.reconnectCount = 0;

            // 延迟发送登录消息，确保连接完全就绪
            setTimeout(() => {
                this._sendLoginMessage();
            }, 100);

            // 启动心跳
            this._startHeartbeat();
        });

        this.socketTask.onMessage((res: any) => {
            console.log('[WebSocket] Received message:', res.data);
            try {
                const data = JSON.parse(res.data);

                // 处理心跳响应
                if (data.type === 'pong') {
                    return;
                }

                // 触发全局事件，其他页面可以监听
                uni.$emit('ws_message', data);
            } catch (e) {
                console.error('[WebSocket] Failed to parse message:', e);
            }
        });

        this.socketTask.onClose(() => {
            console.log('[WebSocket] Connection closed');
            this.isConnected = false;
            this._stopHeartbeat();

            // 如果不是手动关闭，则尝试重连
            if (!this.isManualClose) {
                this._handleReconnect();
            }
        });

        this.socketTask.onError((err: any) => {
            console.error('[WebSocket] Event: onError', err);
            this.isConnected = false;
        });
    }

    /**
     * 发送登录消息
     */
    private async _sendLoginMessage() {
        const token = uni.getStorageSync('token');
        if (!token) {
            console.warn('[WebSocket] No token found, skip login message');
            return;
        }

        const loginMsg = {
            action: 'login',
            token: token
        };

        console.log('[WebSocket] Sending login message with token');
        
        // Use direct socketTask.send if available to avoid isConnected check if we are in the middle of onOpen
        try {
            const message = JSON.stringify(loginMsg);
            if (this.socketTask) {
                this.socketTask.send({
                    data: message,
                    success: () => console.log('[WebSocket] Login message sent successfully'),
                    fail: (err: any) => console.error('[WebSocket] Failed to send login message', err)
                });
            }
        } catch (e) {
            console.error('[WebSocket] Login message error:', e);
        }
    }

    /**
     * 启动心跳
     */
    private _startHeartbeat() {
        this._stopHeartbeat(); 

        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send({ action: 'ping' });
            }
        }, this.heartbeatInterval);
    }

    /**
     * 停止心跳
     */
    private _stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 处理重连
     */
    private _handleReconnect() {
        // 清除旧的重连定时器
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.reconnectCount >= this.maxReconnectCount) {
            console.error('[WebSocket] Max reconnect attempts reached');
            return;
        }

        this.reconnectCount++;
        // 指数退避：3s, 6s, 12s, 24s, 30s, 30s...
        const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectCount - 1), this.maxReconnectInterval);
        console.log(`[WebSocket] Reconnecting in ${delay}ms... (attempt ${this.reconnectCount})`);

        this.reconnectTimer = setTimeout(() => {
            this._createConnection();
        }, delay);
    }

    /**
     * 发送消息
     */
    send(data: any) {
        if (!this.socketTask) {
            return false;
        }

        if (!this.isConnected) {
            return false;
        }

        return new Promise<boolean>((resolve) => {
            try {
                const message = typeof data === 'string' ? data : JSON.stringify(data);

                this.socketTask.send({
                    data: message,
                    success: () => {
                        console.log('[WebSocket] Message sent:', message);
                        resolve(true);
                    },
                    fail: (err: any) => {
                        console.error('[WebSocket] Failed to send message:', err);
                        resolve(false);
                    }
                });
            } catch (e) {
                console.error('[WebSocket] Send error:', e);
                resolve(false);
            }
        });
    }

    /**
     * 发送聊天消息
     */
    async sendChatMessage(receiverId: number, content: string, msgType: number = 0) {
        const success = await this.send({
            action: 'msg',
            receiverId,
            content,
            msgType
        });

        if (!success) {
            uni.showToast({
                title: '消息发送失败',
                icon: 'none'
            });
        }

        return success;
    }

    /**
     * 手动关闭连接
     */
    close() {
        this.isManualClose = true;
        this.isConnected = false;

        // 停止心跳
        this._stopHeartbeat();

        // 清除重连定时器
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // 关闭连接
        if (this.socketTask) {
            this.socketTask.close({
                success: () => {
                    console.log('[WebSocket] Connection closed manually');
                }
            });
            this.socketTask = null;
        }
    }

    /**
     * 获取���接状态
     */
    getConnectStatus(): boolean {
        return this.isConnected;
    }

    /**
     * 重新连接（用于切换用户等场景）
     */
    reconnect(userId: number) {
        this.close();
        setTimeout(() => {
            this.connect(userId);
        }, 1000);
    }
}

// 导出单例
export default new WebSocketManager();
