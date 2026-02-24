<template>
    <view class="container">
        <!-- 顶部渐变区域 -->
        <view class="header-bg">
            <view class="result-icon" v-if="status === 'success'">
                <up-icon name="checkmark-circle" color="#fff" size="80"></up-icon>
            </view>
            <view class="result-icon" v-else-if="status === 'checking'">
                <up-loading-icon color="#fff" size="60"></up-loading-icon>
            </view>
            <view class="result-icon" v-else>
                <up-icon name="info-circle" color="#fff" size="80"></up-icon>
            </view>

            <text class="result-title">
                {{ status === 'success' ? '充值成功' : status === 'checking' ? '支付确认中...' : '支付处理中' }}
            </text>
            <text class="result-amount" v-if="rechargeAmount">¥{{ rechargeAmount }}</text>
        </view>

        <!-- 详情卡片 -->
        <view class="detail-card">
            <view class="detail-row" v-if="rechargeAmount">
                <text class="label">充值金额</text>
                <text class="value">¥{{ rechargeAmount }}</text>
            </view>
            <view class="detail-row" v-if="orderNo">
                <text class="label">订单编号</text>
                <text class="value order-no">{{ orderNo }}</text>
            </view>
            <view class="detail-row">
                <text class="label">支付状态</text>
                <text class="value" :class="{ success: status === 'success' }">
                    {{ status === 'success' ? '已到账' : '等待确认' }}
                </text>
            </view>
        </view>

        <!-- 提示信息 -->
        <view class="tips-card" v-if="status !== 'success'">
            <text class="tip-text">· 支付完成后，余额通常会在几秒内到账</text>
            <text class="tip-text">· 如果长时间未到账，请联系客服处理</text>
        </view>

        <!-- 操作按钮 -->
        <view class="action-area">
            <up-button text="返回充值" shape="circle"
                customStyle="height: 90rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; font-size: 30rpx; font-weight: bold; border: none;"
                @click="goRecharge"></up-button>

            <up-button text="返回首页" shape="circle" type="info" plain
                customStyle="height: 90rpx; margin-top: 24rpx; font-size: 30rpx; border-color: #ddd; color: #666;"
                @click="goHome"></up-button>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const status = ref('checking'); // checking | success | pending
const orderNo = ref('');
const rechargeAmount = ref('');
const isPolling = ref(false);

const goRecharge = () => {
    uni.redirectTo({ url: '/pages/user/recharge' });
};

const goHome = () => {
    uni.switchTab({ url: '/pages/index/index' });
};

const pollRechargeStatus = (oNo: string) => {
    if (isPolling.value) return;
    isPolling.value = true;

    let attempts = 0;
    const maxAttempts = 15;
    const interval = 2000;

    const check = () => {
        attempts++;
        request({
            url: '/recharge/status',
            params: { orderNo: oNo }
        }).then((res: any) => {
            if (res.code === 200 && res.data) {
                if (res.data.status === 1) {
                    status.value = 'success';
                    rechargeAmount.value = Number(res.data.amount).toFixed(2);
                    isPolling.value = false;
                    return;
                }
            }
            if (attempts < maxAttempts) {
                setTimeout(check, interval);
            } else {
                status.value = 'pending';
                isPolling.value = false;
            }
        }).catch(() => {
            if (attempts < maxAttempts) {
                setTimeout(check, interval);
            } else {
                status.value = 'pending';
                isPolling.value = false;
            }
        });
    };

    check();
};

onLoad(() => {
    // 从 localStorage 获取充值订单号
    const pendingOrderNo = uni.getStorageSync('pendingRechargeOrderNo');
    if (pendingOrderNo) {
        orderNo.value = pendingOrderNo;
        uni.removeStorageSync('pendingRechargeOrderNo');
        pollRechargeStatus(pendingOrderNo);
    } else {
        status.value = 'pending';
    }
});

onShow(() => {
    // 如果从外部返回且仍在 checking 状态，继续轮询
    const pendingOrderNo = uni.getStorageSync('pendingRechargeOrderNo');
    if (pendingOrderNo && !isPolling.value) {
        orderNo.value = pendingOrderNo;
        uni.removeStorageSync('pendingRechargeOrderNo');
        pollRechargeStatus(pendingOrderNo);
    }
});
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background: #f7f8fa;
}

.header-bg {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    padding: 80rpx 0 60rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;

    .result-icon {
        margin-bottom: 24rpx;
    }

    .result-title {
        font-size: 36rpx;
        color: #fff;
        font-weight: bold;
        margin-bottom: 16rpx;
    }

    .result-amount {
        font-size: 56rpx;
        color: #fff;
        font-weight: 800;
        font-family: 'Helvetica Neue', sans-serif;
    }
}

.detail-card {
    background: #fff;
    margin: 30rpx;
    border-radius: 16rpx;
    padding: 0 32rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 30rpx 0;
        border-bottom: 1rpx solid #f8f8f8;

        &:last-child {
            border-bottom: none;
        }

        .label {
            font-size: 28rpx;
            color: #999;
        }

        .value {
            font-size: 28rpx;
            color: #333;
            font-weight: 500;

            &.success {
                color: #52c41a;
                font-weight: bold;
            }

            &.order-no {
                font-size: 24rpx;
                color: #999;
            }
        }
    }
}

.tips-card {
    background: #fffbe6;
    border: 1rpx solid #ffe58f;
    margin: 0 30rpx 30rpx;
    padding: 24rpx 30rpx;
    border-radius: 12rpx;

    .tip-text {
        display: block;
        font-size: 24rpx;
        color: #fa8c16;
        line-height: 1.6;
    }
}

.action-area {
    padding: 40rpx 30rpx;
}
</style>
