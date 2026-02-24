<template>
    <view class="container">
        <!-- Header: Stats Overview -->
        <view class="header-stats">
            <view class="stats-card">
                <view class="item">
                    <text class="num">{{ stats.totalUsers }}</text>
                    <text class="label">总用户数</text>
                </view>
                <view class="item">
                    <text class="num highlight">¥{{ stats.todayRevenue }}</text>
                    <text class="label">今日营收</text>
                </view>
                <view class="item">
                    <text class="num">{{ stats.unpaidOrders }}</text>
                    <text class="label">待支付订单</text>
                </view>
                <view class="item" @click="navTo('/pages/admin/feedback_list')">
                    <text class="num" :class="{ warning: stats.pendingFeedback > 0 }">{{ stats.pendingFeedback }}</text>
                    <text class="label">待处理咨询</text>
                </view>
            </view>
        </view>

        <!-- Management Modules -->
        <view class="module-group" v-for="(group, gIdx) in modules" :key="gIdx">
            <view class="group-title">{{ group.title }}</view>
            <view class="grid-wrap">
                <view class="grid-item" v-for="(item, iIdx) in group.list" :key="iIdx" @click="navTo(item.url)">
                    <view class="icon-box" :style="{ backgroundColor: item.bg }">
                        <up-icon :name="item.icon" color="#fff" size="24"></up-icon>
                        <!-- Badge for items like 'User Messages' -->
                        <view class="badge" v-if="item.badge > 0">{{ item.badge > 99 ? '99+' : item.badge }}</view>
                    </view>
                    <text class="text">{{ item.name }}</text>
                </view>
            </view>
        </view>

        <view class="footer-tip">
            <text>Baoliao Admin System v1.0</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { reactive, onUnmounted } from 'vue';
import { onShow, onHide } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const stats = reactive({
    totalUsers: 0,
    todayRevenue: '0.00',
    unpaidOrders: 0,
    pendingFeedback: 0
});

const modules = reactive([
    {
        title: '内容管理',
        list: [
            { name: '爆料管理', icon: 'list-dot', url: '/pages/admin/content_list', bg: '#37b24d', badge: 0 },
            { name: '公告管理', icon: 'volume-fill', url: '/pages/admin/announcement', bg: '#fcc419', badge: 0 }
        ]
    },
    {
        title: '用户与咨询',
        list: [
            { name: '用户管理', icon: 'account-fill', url: '/pages/admin/user_list', bg: '#4dabf7', badge: 0 },
            { name: '商家审核', icon: 'home-fill', url: '/pages/admin/merchant_apply_list', bg: '#ff6b6b', badge: 0 },
            { name: '用户消息', icon: 'chat-fill', url: '/pages/admin/chat_list', bg: '#748ffc', badge: 0 },
            { name: '反馈建议', icon: 'edit-pen-fill', url: '/pages/admin/feedback_list', bg: '#20c997', badge: 0 }
        ]
    },
    {
        title: '财务与系统',
        list: [
            { name: '订单记录', icon: 'order', url: '/pages/admin/order_list', bg: '#f06595', badge: 0 },
            { name: '系统设置', icon: 'setting', url: '/pages/admin/config', bg: '#ae3ec9', badge: 0 },
            { name: '短信配置', icon: 'email-fill', url: '/pages/admin/sms_config', bg: '#ff922b', badge: 0 },
            { name: '推广分享', icon: 'share-fill', url: '/pages/admin/share_promo', bg: '#845ef7', badge: 0 }
        ]
    }
]);

onShow(() => {
    fetchStats();
    // 监听 WebSocket 消息，实时刷新
    uni.$on('ws_message', handleWsMessage);
});

onHide(() => {
    uni.$off('ws_message', handleWsMessage);
});

const handleWsMessage = (data: any) => {
    // 收到任何新消息业务，都刷新统计数据（包括未读咨询数）
    fetchStats();
};

const fetchStats = () => {
    request({ url: '/stats/summary' }).then((res: any) => {
        Object.assign(stats, res.data || {});
        updateMenuBadges();
    });
};

const updateMenuBadges = () => {
    // 特别更新“用户消息”的角标
    const userMsgGroup = modules.find(g => g.title === '用户与咨询');
    if (userMsgGroup) {
        const chatItem = userMsgGroup.list.find(i => i.name === '用户消息');
        if (chatItem) {
            // 获取真正的未读聊天消息数
            request({ url: '/chat/unread-count' }).then((res: any) => {
                console.log('[Dashboard] Unread chat count res:', res);
                chatItem.badge = res.data || 0;
            }).catch(err => {
                console.error('[Dashboard] Failed to fetch unread count:', err);
            });
        }
    }
};

const navTo = (url: string) => {
    uni.navigateTo({ url });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f8fafc;
    padding-bottom: 40rpx;
}

.header-stats {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    padding: 60rpx 30rpx 100rpx;

    .stats-card {
        background: rgba(255, 255, 255, 1);
        border-radius: 20rpx;
        padding: 40rpx 20rpx;
        display: flex;
        justify-content: space-between;
        box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);

        .item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;

            &:not(:last-child)::after {
                content: '';
                position: absolute;
                right: 0;
                top: 20%;
                height: 60%;
                width: 1px;
                background: #f0f0f0;
            }

            .num {
                font-size: 36rpx;
                font-weight: 800;
                color: #333;
                margin-bottom: 8rpx;

                &.highlight {
                    color: #ff4757;
                }

                &.warning {
                    color: #fcc419;
                }
            }

            .label {
                font-size: 22rpx;
                color: #999;
            }
        }
    }
}

.module-group {
    margin: -40rpx 30rpx 0;
    position: relative;
    z-index: 10;

    &:not(:first-child) {
        margin-top: 30rpx;
    }

    .group-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #666;
        margin-bottom: 20rpx;
        padding-left: 10rpx;
    }

    .grid-wrap {
        background: #fff;
        border-radius: 20rpx;
        display: flex;
        flex-wrap: wrap;
        padding: 30rpx 10rpx;
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);

        .grid-item {
            width: 33.33%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20rpx 0;

            .icon-box {
                width: 88rpx;
                height: 88rpx;
                border-radius: 24rpx;
                margin-bottom: 16rpx;
                box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.1);
                position: relative;

                .badge {
                    position: absolute;
                    top: -10rpx;
                    right: -10rpx;
                    background-color: #ff4757;
                    color: #fff;
                    font-size: 20rpx;
                    min-width: 32rpx;
                    height: 32rpx;
                    border-radius: 16rpx;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 8rpx;
                    border: 2rpx solid #fff;
                    z-index: 100;
                }
            }

            .text {
                font-size: 26rpx;
                color: #444;
            }
        }
    }
}

.footer-tip {
    text-align: center;
    padding: 60rpx 0;
    font-size: 22rpx;
    color: #ccc;
}
</style>
