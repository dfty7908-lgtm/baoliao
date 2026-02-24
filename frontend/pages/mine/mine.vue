<template>
    <view class="container">
        <!-- User Info Header -->
        <view class="user-header">
            <view class="user-info-box">
                <up-avatar :src="userInfo.avatar || '/static/logo.png'" size="64"
                    customStyle="border: 4rpx solid #fff; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);"></up-avatar>
                <view class="info-text">
                    <view class="nickname">{{ userInfo.nickname || '未登录用户' }}</view>
                    <view class="user-id">
                        <text>ID: {{ userId || '-------' }}</text>
                    </view>
                </view>
            </view>
            <view class="setting-btn" @click="goSettings">
                <up-icon name="setting-fill" size="24" color="#ff4757"></up-icon>
            </view>
        </view>

        <!-- Balance Card -->
        <view class="balance-card">
            <view class="card-inner">
                <view class="left">
                    <view class="card-title">我的可用余额 (元)</view>
                    <view class="balance-amount">{{ balance }}</view>
                </view>
                <view class="right">
                    <up-button class="recharge-btn" type="primary" text="立即充值" @click="goRecharge"
                        customStyle="height: 64rpx; border-radius: 32rpx; font-weight: bold; background: #fff !important; color: #ff4757 !important; border: none;"></up-button>
                </view>
            </view>
        </view>

        <!-- Tools List -->
        <view class="tools-list">
            <!-- 资金账单已隐藏 -->

            <view class="list-item" v-if="userInfo.role === 'ADMIN'" @click="goAdmin">
                <view class="item-left">
                    <up-icon name="bag-fill" size="22" color="#ff4757"></up-icon>
                    <text>后台管理</text>
                    <view class="unread-badge" v-if="unreadCount > 0">{{ unreadCount }}</view>
                </view>
                <up-icon name="arrow-right" size="14" color="#ccc"></up-icon>
            </view>

            <view class="list-item" @click="goFeedback">
                <view class="item-left">
                    <up-icon name="edit-pen" size="22" color="#ff4757"></up-icon>
                    <text>意见反馈</text>
                </view>
                <up-icon name="arrow-right" size="14" color="#ccc"></up-icon>
            </view>

            <view class="list-item" @click="goPrivacy">
                <view class="item-left">
                    <up-icon name="lock-fill" size="22" color="#ff4757"></up-icon>
                    <text>隐私协议</text>
                </view>
                <up-icon name="arrow-right" size="14" color="#ccc"></up-icon>
            </view>

            <view class="list-item" @click="goMerchantApply">
                <view class="item-left">
                    <up-icon name="home-fill" size="22" color="#ff4757"></up-icon>
                    <text>申请商家</text>
                </view>
                <up-icon name="arrow-right" size="14" color="#ccc"></up-icon>
            </view>
        </view>

        <view class="logout-btn-box">
            <up-button text="退出登录" :plain="true" color="#ff4757" shape="circle" @click="logout"
                customStyle="height: 88rpx; border-radius: 44rpx;"></up-button>
        </view>

        <!-- Logout Modal -->
        <up-modal :show="modal.show" title="提示" showCancelButton confirmColor="#ff4757" cancelColor="#606266"
            @confirm="handleLogout" @cancel="closeModal">
            <view class="modal-content">确定退出登录吗？</view>
        </up-modal>
    </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { onShow, onHide } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const userId = ref(uni.getStorageSync('userId') || '');
const userInfo = ref<any>(uni.getStorageSync('userInfo') || {});
const balance = ref('0.00');

const modal = ref({
    show: false
});

const closeModal = () => {
    modal.value.show = false;
};

const unreadCount = ref(0);

// 从服务器获取最新用户信息
const loadUserInfo = () => {
    if (!userId.value) return;
    request({
        url: `/user/info`,
        method: 'GET'
    }).then((res: any) => {
        if (res.code === 200 && res.data) {
            userInfo.value = res.data;
            balance.value = res.data.balance ? Number(res.data.balance).toFixed(2) : '0.00';
            // 更新本地存储
            uni.setStorageSync('userInfo', res.data);

            // Load unread count for badge
            loadUnreadCount();
        }
    }).catch((err: any) => {
        console.error('获取用户信息失败:', err);
    });
};

const loadUnreadCount = () => {
    request({
        url: '/chat/unread-count',
        method: 'GET'
    }).then((res: any) => {
        if (res.code === 200) {
            const count = res.data || 0;
            unreadCount.value = count;
            if (userInfo.value.role === 'ADMIN') {
                // Admin: badge on index 3 (Mine tab)
                if (count > 0) {
                    uni.setTabBarBadge({ index: 3, text: String(count) });
                } else {
                    try { uni.removeTabBarBadge({ index: 3 }); } catch (e) { }
                }
                try { uni.removeTabBarBadge({ index: 2 }); } catch (e) { }
            } else {
                // User: badge on index 2 (Messages tab)
                if (count > 0) {
                    uni.setTabBarBadge({ index: 2, text: String(count) });
                } else {
                    try { uni.removeTabBarBadge({ index: 2 }); } catch (e) { }
                }
            }
        }
    });
};

// 初始化余额显示
if (userInfo.value.balance !== undefined) {
    balance.value = Number(userInfo.value.balance).toFixed(2);
}

const logout = () => {
    modal.value.show = true;
};

const handleLogout = () => {
    uni.clearStorageSync();
    uni.reLaunch({ url: '/pages/login/login' });
};

const goRecharge = () => uni.navigateTo({ url: '/pages/user/recharge' });
const goFeedback = () => uni.navigateTo({ url: '/pages/user/feedback' });
const goPrivacy = () => uni.navigateTo({ url: '/pages/user/privacy' });
const goMerchantApply = () => uni.navigateTo({ url: '/pages/user/merchant_apply' });
const goBills = () => uni.navigateTo({ url: '/pages/user/bills' });
const goSettings = () => uni.navigateTo({ url: '/pages/user/settings' });
const goAdmin = () => uni.navigateTo({ url: '/pages/admin/dashboard' });
const goChatList = () => uni.navigateTo({ url: '/pages/admin/chat_list' });


onShow(() => {
    if (!uni.getStorageSync('userId')) {
        uni.reLaunch({ url: '/pages/login/login' });
        return;
    }
    // 每次进入页面刷新用户信息
    loadUserInfo();

    // 监听 WebSocket 消息实时刷新未读数
    uni.$on('ws_message', handleWsMessage);
});

onHide(() => {
    uni.$off('ws_message', handleWsMessage);
});

onUnmounted(() => {
    uni.$off('ws_message', handleWsMessage);
});

const handleWsMessage = () => {
    if (userInfo.value.role === 'ADMIN') {
        loadUnreadCount();
    }
};

// onShow is already used for loadUserInfo
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
    padding-bottom: 50rpx;
}

.user-header {
    background: #fff;
    padding: 60rpx 40rpx 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);

    .user-info-box {
        display: flex;
        align-items: center;

        .info-text {
            margin-left: 24rpx;

            .nickname {
                font-size: 40rpx;
                font-weight: 800;
                color: #222;
                margin-bottom: 8rpx;
            }

            .user-id {
                font-size: 24rpx;
                color: #999;
                background: #f5f5f5;
                padding: 4rpx 16rpx;
                border-radius: 20rpx;
            }
        }
    }
}

.balance-card {
    margin: 40rpx;
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    border-radius: 32rpx;
    padding: 48rpx;
    box-shadow: 0 16rpx 32rpx rgba(255, 71, 87, 0.15);

    .card-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 20rpx;
        }

        .balance-amount {
            font-size: 64rpx;
            font-weight: 900;
            color: #fff;
            font-family: 'Helvetica Neue', sans-serif;
        }
    }
}

.tools-list {
    margin: 40rpx;
    background: #fff;
    border-radius: 28rpx;
    padding: 10rpx 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.02);

    .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 36rpx 0;
        border-bottom: 1rpx solid #fafafa;

        &:last-child {
            border-bottom: none;
        }

        .item-left {
            display: flex;
            align-items: center;

            text {
                font-size: 30rpx;
                font-weight: 600;
                color: #333;
                margin-left: 20rpx;
            }

            .unread-badge {
                margin-left: 12rpx;
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
            }
        }
    }
}

.logout-btn-box {
    margin: 60rpx 50rpx;
}

.modal-content {
    padding: 40rpx 0;
    text-align: center;
    color: #606266;
    font-size: 30rpx;
}
</style>
