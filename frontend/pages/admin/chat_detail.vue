<template>
    <view class="container">
        <!-- Message List -->
        <scroll-view class="chat-area" scroll-y :scroll-top="scrollTop" :scroll-with-animation="false"
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
                    :class="{ 'me': msg.senderId == myId }">
                    <view class="time-tip" v-if="shouldShowTime(messages, index)">
                        {{ formatTime(msg.createTime) }}
                    </view>

                    <view class="msg-content-box">
                        <up-avatar :src="msg.senderId == myId ? '/static/logo.png' : targetAvatar || '/static/logo.png'"
                            size="40" shape="square"></up-avatar>

                        <view class="bubble">
                            <text class="text">{{ msg.content }}</text>
                            <view class="triangle"></view>
                        </view>
                    </view>
                </view>
            </view>
            <view id="bottom-anchor" style="height: 20px;"></view>
        </scroll-view>

        <!-- Input Bar -->
        <view class="input-panel">
            <view class="input-wrap">
                <input v-model="inputMsg" class="chat-input" :adjust-position="true" cursor-spacing="20"
                    placeholder="回复消息..." confirm-type="send" @confirm="sendMsg" />
            </view>
            <view class="send-btn" @click="sendMsg" :class="{ 'disabled': !inputMsg.trim() }">
                发送
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import websocket from '@/utils/websocket';
import dayjs from 'dayjs';

const myId = uni.getStorageSync('userId');
const targetUserId = ref('');
const targetNickname = ref('');
const targetAvatar = ref('');
const messages = ref<any[]>([]);
const inputMsg = ref('');
const scrollTop = ref(0);
const loadingOlder = ref(false);
const noMoreHistory = ref(false);

const formatTime = (time: string) => {
    if (!time) return '';
    return dayjs(time).format('MM-DD HH:mm');
};

const shouldShowTime = (list: any[], index: number) => {
    if (index === 0) return true;
    const prev = dayjs(list[index - 1].createTime);
    const curr = dayjs(list[index].createTime);
    return curr.diff(prev, 'minute') > 5;
};

const loadHistory = () => {
    console.log('[ChatDetail] Loading history for otherId:', targetUserId.value);
    request({
        url: '/chat/history',
        method: 'GET',
        params: { otherId: targetUserId.value, limit: 30 }
    }).then((res: any) => {
        console.log('[ChatDetail] History res:', res);
        if (res.code === 200) {
            messages.value = res.data || [];
            if (messages.value.length < 30) {
                noMoreHistory.value = true;
            }
            scrollToBottom();
            // Mark as read
            markRead();
        }
    }).catch(err => {
        console.error('[ChatDetail] Failed to load history:', err);
    });
};

const loadOlderMessages = () => {
    if (loadingOlder.value || noMoreHistory.value || messages.value.length === 0) return;

    const firstMsg = messages.value[0];
    if (!firstMsg || !firstMsg.id) return;

    loadingOlder.value = true;
    request({
        url: '/chat/history',
        method: 'GET',
        params: { otherId: targetUserId.value, beforeId: firstMsg.id, limit: 30 }
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

const markRead = () => {
    request({
        url: '/chat/mark-read',
        method: 'POST',
        data: { senderId: targetUserId.value }
    }).then(() => {
        // 标记已读后刷新 tab badge
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
    });
};

const sendMsg = async () => {
    if (!inputMsg.value.trim()) return;

    const content = inputMsg.value;
    const msg = {
        action: 'msg',
        senderId: Number(myId),
        receiverId: Number(targetUserId.value),
        content: content,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    const success = await websocket.send(msg);
    if (success) {
        messages.value.push(msg);
        inputMsg.value = '';
        scrollToBottom();
    } else {
        uni.showToast({ title: '发送失败', icon: 'none' });
    }
};

const scrollToBottom = () => {
    nextTick(() => {
        setTimeout(() => {
            scrollTop.value = 999999 + Math.random(); // Force update
        }, 100);
    });
};

onLoad((options: any) => {
    if (options.userId) {
        targetUserId.value = options.userId;
        targetNickname.value = options.nickname || '用户';
        uni.setNavigationBarTitle({ title: targetNickname.value });
        loadHistory();
    }

    // 监听 WebSocket 消息
    uni.$on('ws_message', (msg: any) => {
        console.log('[ChatDetail] Received ws_message:', msg);
        // If message is presumably from the current target or related
        if (String(msg.senderId) === String(targetUserId.value) || String(msg.receiverId) === String(targetUserId.value)) {
            messages.value.push(msg);
            scrollToBottom();
            if (String(msg.senderId) === String(targetUserId.value)) {
                markRead();
            }
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
                    border-left: 12rpx solid #ff4757;
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

    .input-wrap {
        flex: 1;
        background: #f5f5f5;
        border-radius: 40rpx;
        padding: 16rpx 30rpx;
        margin-right: 20rpx;

        .chat-input {
            width: 100%;
            font-size: 30rpx;
            height: 40rpx;
        }
    }

    .send-btn {
        background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
        color: #fff;
        font-size: 28rpx;
        padding: 12rpx 32rpx;
        border-radius: 30rpx;

        &.disabled {
            opacity: 0.5;
            background: #ccc;
        }
    }
}
</style>
