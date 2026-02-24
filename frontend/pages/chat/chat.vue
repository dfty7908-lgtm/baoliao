<template>
    <view class="container">
        <!-- Custom Gradient Header -->
        <view class="custom-header">
        </view>

        <!-- Message List -->
        <scroll-view class="chat-area" scroll-y :scroll-top="scrollTop" :scroll-lock="false"
            @scrolltoupper="loadOlderMessages" :upper-threshold="50">
            <!-- Loading indicator -->
            <view class="load-more-tip" v-if="loadingOlder">
                <text>加载中...</text>
            </view>
            <view class="load-more-tip" v-else-if="noMoreHistory">
                <text>没有更多消息了</text>
            </view>

            <view class="msg-list-padding">
                <view class="msg-row" v-for="(msg, index) in messages" :key="msg.id || index"
                    :class="{ 'me': msg.senderId == userId }">
                    <!-- Time Display (Optional logic to show sparsely) -->
                    <view class="time-tip" v-if="index === 0 || shouldShowTime(messages, index)">
                        {{ msg.createTime }}
                    </view>

                    <view class="msg-content-box">
                        <up-avatar :src="msg.senderId == userId ? '/static/logo.png' : '/static/logo.png'" size="40"
                            shape="square"></up-avatar>

                        <view class="bubble">
                            <text class="text">{{ msg.content }}</text>
                            <!-- Triangle for bubble effect -->
                            <view class="triangle"></view>
                        </view>
                    </view>
                </view>
            </view>
            <view id="bottom-anchor" style="height: 20px;"></view>
        </scroll-view>

        <!-- Input Bar (Fixed Bottom) -->
        <view class="input-panel">
            <!-- More Action Icon -->
            <view class="action-btn" @click="handleMoreAction">
                <up-icon name="plus-circle" size="30" color="#666"></up-icon>
            </view>

            <!-- Input Field -->
            <view class="input-wrap">
                <input v-model="inputMsg" class="chat-input" :adjust-position="true" cursor-spacing="20"
                    placeholder="请输入内容..." confirm-type="send" @confirm="sendMsg" />
            </view>

            <!-- Send Button -->
            <view class="send-btn" @click="sendMsg" :class="{ 'disabled': !inputMsg.trim() }">
                发送
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import websocket from '@/utils/websocket';

const userId = uni.getStorageSync('userId');
const messages = ref<any[]>([]);
const inputMsg = ref('');
const scrollTop = ref(0);
const receiverId = ref<number>(0); // 目标用户ID (客服ID)
const loadingOlder = ref(false);
const noMoreHistory = ref(false);

// Helper to show time every 5 mins or so
const shouldShowTime = (list: any[], index: number) => {
    if (index === 0) return true;
    const prev = new Date(list[index - 1].createTime || Date.now()).getTime();
    const curr = new Date(list[index].createTime || Date.now()).getTime();
    return (curr - prev) > 5 * 60 * 1000;
};

const handleMoreAction = () => {
    uni.showToast({ title: '功能开发中', icon: 'none' });
};

const sendMsg = async () => {
    if (!inputMsg.value.trim()) return;
    if (!receiverId.value) {
        uni.showToast({ title: '正在连接客服...', icon: 'none' });
        return;
    }

    const success = await websocket.sendChatMessage(receiverId.value, inputMsg.value);
    if (success) {
        const msg = {
            senderId: userId,
            receiverId: receiverId.value,
            content: inputMsg.value,
            createTime: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
        };
        messages.value.push(msg);
        inputMsg.value = '';
        scrollToBottom();
    }
};

const scrollToBottom = () => {
    nextTick(() => {
        scrollTop.value = 999999 + Math.random();
    });
};

const initChat = (targetId?: number) => {
    // 1. 确定目标ID
    if (targetId) {
        receiverId.value = Number(targetId);
        loadHistory();
    } else {
        // 尝试从本地或API获取
        const cachedAdminId = uni.getStorageSync('adminId');
        if (cachedAdminId) {
            receiverId.value = Number(cachedAdminId);
            loadHistory();
        } else {
            // Fetch remote
            request({ url: '/chat/customer-service' }).then((res: any) => {
                if (res.code === 200 && res.data) {
                    receiverId.value = res.data.customerId;
                    uni.setStorageSync('adminId', receiverId.value);
                    loadHistory();
                }
            });
        }
    }
};

const loadHistory = () => {
    if (!receiverId.value) return;
    request({
        url: '/chat/history',
        params: { otherId: receiverId.value, limit: 30 }
    }).then((res: any) => {
        if (res.code === 200) {
            messages.value = res.data || [];
            if (messages.value.length < 30) {
                noMoreHistory.value = true;
            }
            scrollToBottom();
            // 进入聊天页面后标记对方发来的消息为已读
            markAsRead();
        }
    });
};

const loadOlderMessages = () => {
    if (loadingOlder.value || noMoreHistory.value || messages.value.length === 0) return;

    const firstMsg = messages.value[0];
    if (!firstMsg || !firstMsg.id) return;

    loadingOlder.value = true;
    request({
        url: '/chat/history',
        params: { otherId: receiverId.value, beforeId: firstMsg.id, limit: 30 }
    }).then((res: any) => {
        loadingOlder.value = false;
        if (res.code === 200) {
            const olderMsgs = res.data || [];
            if (olderMsgs.length === 0 || olderMsgs.length < 30) {
                noMoreHistory.value = true;
            }
            if (olderMsgs.length > 0) {
                messages.value = [...olderMsgs, ...messages.value];
            }
        }
    }).catch(() => {
        loadingOlder.value = false;
    });
};

const markAsRead = () => {
    if (!receiverId.value) return;
    request({
        url: '/chat/mark-read',
        method: 'POST',
        data: { senderId: receiverId.value }
    }).then(() => {
        // 标记已读后刷新 tab badge
        updateTabBadge();
    });
};

const updateTabBadge = () => {
    request({ url: '/chat/unread-count' }).then((res: any) => {
        if (res.code === 200) {
            const count = res.data || 0;
            try {
                if (count > 0) {
                    uni.setTabBarBadge({ index: 2, text: String(count) });
                } else {
                    uni.removeTabBarBadge({ index: 2 });
                    uni.removeTabBarBadge({ index: 3 });
                }
            } catch (e) {
                // 非 TabBar 页面调用会失败，忽略
            }
        }
    });
};

onLoad((options: any) => {
    const target = options.targetId; // 允许传入目标ID
    initChat(target);
});

onMounted(() => {
    uni.$on('ws_message', (msg) => {
        // 只有当消息来源是当前聊天对象时才添加到列表
        if (msg.senderId == receiverId.value) {
            messages.value.push(msg);
            scrollToBottom();
            // 收到消息时立即标记已读
            markAsRead();
        }
    });
});

onUnmounted(() => {
    uni.$off('ws_message');
});
</script>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;
    background: #f7f8fa;
    /* #ifdef H5 */
    height: calc(100vh - var(--window-top));
    /* #endif */
    /* #ifndef H5 */
    height: 100vh;
    /* #endif */
}

.custom-header {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
}

.chat-area {
    flex: 1;
    overflow: hidden;
    background: #f7f8fa;
}

.load-more-tip {
    text-align: center;
    padding: 20rpx 0;
    font-size: 24rpx;
    color: #ccc;
}

.msg-list-padding {
    padding: 30rpx 30rpx 0;
}

.msg-row {
    margin-bottom: 40rpx;
    display: flex;
    flex-direction: column;

    .time-tip {
        text-align: center;
        font-size: 22rpx;
        color: #ccc;
        margin-bottom: 20rpx;
    }

    .msg-content-box {
        display: flex;
        align-items: flex-start;

        .bubble {
            max-width: 70%;
            background: #fff;
            padding: 20rpx 24rpx;
            border-radius: 12rpx;
            margin-left: 20rpx;
            position: relative;
            box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);

            .text {
                font-size: 30rpx;
                color: #333;
                line-height: 1.5;
                word-break: break-all;
            }

            .triangle {
                position: absolute;
                top: 24rpx;
                left: -12rpx;
                width: 0;
                height: 0;
                border-top: 10rpx solid transparent;
                border-bottom: 10rpx solid transparent;
                border-right: 12rpx solid #fff;
            }
        }
    }

    &.me {
        .msg-content-box {
            flex-direction: row-reverse;

            .bubble {
                margin-left: 0;
                margin-right: 20rpx;
                background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);

                .text {
                    color: #fff;
                }

                .triangle {
                    left: auto;
                    right: -12rpx;
                    border-right: none;
                    border-left: 12rpx solid #ff4757; // Match gradient end
                }
            }
        }
    }
}

.input-panel {
    background: #fff;
    padding: 20rpx 24rpx;
    padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    border-top: 1rpx solid #f0f0f0;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.02);

    .action-btn {
        margin-right: 20rpx;
        padding: 10rpx;
    }

    .input-wrap {
        flex: 1;
        background: #f5f5f5;
        border-radius: 40rpx;
        padding: 16rpx 30rpx;
        margin-right: 20rpx;

        .chat-input {
            width: 100%;
            font-size: 30rpx;
            color: #333;
            height: 40rpx; // min-height logic
            line-height: 40rpx;
        }
    }

    .send-btn {
        background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
        color: #fff;
        font-size: 28rpx;
        padding: 12rpx 32rpx;
        border-radius: 30rpx;
        transition: opacity 0.2s;

        &.disabled {
            opacity: 0.5;
            background: #ccc;
        }
    }
}
</style>
