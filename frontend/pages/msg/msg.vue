<template>
    <view class="container">
        <!-- Gradient Header -->
        <view class="custom-header">
        </view>

        <view class="content">
            <view v-if="msgs && msgs.length > 0" class="msg-list">
                <view class="msg-item" v-for="(item, index) in msgs" :key="index" @click="handleMsgClick(item)">
                    <view class="msg-icon">
                        <up-icon :name="item.icon" size="28" color="#fff"></up-icon>
                    </view>
                    <view class="msg-body">
                        <view class="msg-row">
                            <text class="msg-title">{{ item.title }}</text>
                            <text class="msg-time">{{ item.createTime || '刚刚' }}</text>
                        </view>
                        <view class="msg-desc u-line-1">{{ item.desc }}</view>
                    </view>
                    <up-badge v-if="item.unread > 0" :value="item.unread" max="99" absolute
                        :offset="[-10, -10]"></up-badge>
                </view>
            </view>
            <view v-else class="empty-state">
                <up-icon name="grid" size="60" color="#eee"></up-icon>
                <text class="empty-text">暂无记录</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const msgs = ref<any[]>([]);

const formatTime = (time: any) => {
    if (!time) return '刚刚';
    const d = dayjs(time);
    if (!d.isValid()) return time;

    const now = dayjs();
    if (d.isSame(now, 'day')) {
        return d.format('HH:mm');
    }
    if (d.isSame(now, 'year')) {
        return d.format('MM-DD HH:mm');
    }
    return d.format('YYYY-MM-DD HH:mm');
};

const markAllRead = () => {
    const userId = uni.getStorageSync('userId') || 2; // 获取当前登录用户ID，默认2
    const senderId = 1; // 客服ID

    // 调用后端标记所有消息为已读
    request({
        url: '/chat/mark-read',
        method: 'POST',
        data: {
            userId,
            senderId
        }
    }).then(() => {
        uni.showToast({ title: '已全部标记为已读', icon: 'success' });
        // 更新前端显示
        msgs.value.forEach(item => item.unread = 0);
    });
};

const handleMsgClick = (item: any) => {
    if (item.type === 'chat') {
        // 标记消息为已读
        markChatAsRead(item);
        uni.navigateTo({ url: '/pages/chat/chat' });
    }
};

const markChatAsRead = (item: any) => {
    const userId = uni.getStorageSync('userId') || 2;
    // 使用item中绑定的真实客服ID，仅当没有时回退到1
    const senderId = item.targetId || uni.getStorageSync('adminId') || 1;

    request({
        url: '/chat/mark-read',
        method: 'POST',
        data: {
            userId,
            senderId
        }
    }).then(() => {
        item.unread = 0; // 更新前端显示
    });
};

const loadData = () => {
    const userId = uni.getStorageSync('userId') || 2;
    const userInfo = uni.getStorageSync('userInfo');

    // 1. 获取客服信息 (动态获取AdminID)
    const p0 = request({ url: '/chat/customer-service' });
    // 2. 获取未读数
    const p1 = request({ url: '/chat/unread-count', data: { userId } });
    // 3. 获取会话列表
    const p3 = request({ url: '/chat/conversations' });

    Promise.all([p0, p1, p3]).then(([res0, res1, res3]: any[]) => {
        // 客服信息
        let adminId = 1; // 默认Fallback
        let adminInfo = null;
        if (res0.code === 200 && res0.data) {
            adminId = res0.data.customerId;
            adminInfo = res0.data.customerInfo;
            // 保存客服ID到本地，供Chat页使用
            uni.setStorageSync('adminId', adminId);
        }

        const unreadCount = res1.data || 0;
        // 同步更新 tab badge
        try {
            if (unreadCount > 0) {
                uni.setTabBarBadge({ index: 2, text: String(unreadCount) });
            } else {
                uni.removeTabBarBadge({ index: 2 });
            }
        } catch (e) { }

        // 构造会话项
        const lastMsg = res3.data && res3.data.length > 0 ? res3.data[0] : null;

        const chatSession = {
            id: 'chat_001',
            type: 'chat',
            targetId: adminId,
            title: '在线客服',
            desc: lastMsg ? lastMsg.content : '点击联系在线客服',
            createTime: lastMsg ? formatTime(lastMsg.createTime) : '刚刚',
            unread: unreadCount,
            icon: 'server-fill'
        };

        msgs.value = [chatSession];
    }).catch(err => {
        console.error('加载消息失败', err);
        msgs.value = [{
            id: 'chat_001',
            type: 'chat',
            targetId: 1,
            title: '在线客服',
            desc: '网络异常，请检查连接',
            createTime: '刚刚',
            unread: 0,
            icon: 'server-fill'
        }];
    });
};

onShow(() => {
    loadData();
});
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
}

.custom-header {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
}

.nav-right {
    display: flex;
    align-items: center;
    color: #fff;
    font-size: 26rpx;
    margin-right: 20rpx;
}

.msg-item {
    background: #fff;
    padding: 30rpx;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: flex-start;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
    position: relative;

    .msg-icon {
        width: 80rpx;
        height: 80rpx;
        background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
        border-radius: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        flex-shrink: 0;
        overflow: hidden;
    }

    .msg-body {
        flex: 1;
        overflow: hidden;

        .msg-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8rpx;

            .msg-title {
                font-size: 30rpx;
                font-weight: 700;
                color: #333;
            }

            .msg-time {
                font-size: 24rpx;
                color: #999;
            }
        }

        .msg-desc {
            font-size: 26rpx;
            color: #666;
            line-height: 1.4;
        }
    }
}

.msg-list {
    padding: 32rpx;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 200rpx;

    .empty-icon-wrap {
        width: 160rpx;
        height: 160rpx;
        background: #fff;
        border-radius: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30rpx;
    }

    .empty-text {
        margin-top: 20rpx;
        font-size: 28rpx;
        color: #999;
    }
}
</style>
