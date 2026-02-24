<template>
    <view class="container">


        <view class="main-content" v-if="detail">
            <!-- 1. Title Card -->
            <view class="card title-card">
                <view class="status-badges" v-if="detail.isPublic === 1 || detail.isTop === 1">
                    <view v-if="detail.isPublic === 1" class="status-tag green">公开</view>
                    <view v-if="detail.isTop === 1" class="status-tag orange">置顶</view>
                </view>
                <view class="title-row">
                    <text class="title">{{ detail.title }}</text>
                    <view class="tags" v-if="detail.tagList && detail.tagList.length > 0">
                        <view class="tag text-tag" v-for="(tag, idx) in detail.tagList" :key="idx">{{ tag }}</view>
                    </view>
                </view>
                <view class="time-row">
                    <text>发布于 {{ formatDate(detail.createTime) }}</text>
                </view>
                <view class="public-time-row" v-if="detail.publicTime">
                    <view class="time-divider"></view>
                    <text class="public-time">公开于 {{ formatDate(detail.publicTime) }}</text>
                </view>

                <!-- Status Stamp -->
                <view class="status-stamp" v-if="detail.isWinner">
                    <view class="stamp-inner" :class="detail.isWinner === 1 ? 'red' : 'black'">
                        <view class="stamp-text">{{ detail.isWinner === 1 ? '红' : '黑' }}</view>
                    </view>
                </view>
            </view>

            <!-- 2. Tips Card (Collapsible) -->
            <view class="card tips-card">
                <view class="tips-header" @click="showTips = !showTips">
                    <text class="tips-title">{{ fromOrder ? '温馨提示:' : '免责声明:' }}</text>
                    <text class="tips-toggle">{{ showTips ? '收起' : '查看更多' }} <text class="arrow">{{ showTips ? '∧' : '∨'
                            }}</text></text>
                </view>
                <view class="tips-body" v-if="showTips">
                    <text class="tips-text"
                        v-if="!fromOrder">本付费内容为电子虚拟物品，解锁后不支持退款，所有文字、图片仅供参考，不保证连续性及任何承诺，自愿付费谨慎购买下单，购买即接受协议，本声明具有法律效力依据，请悉知！</text>
                    <text class="tips-text"
                        v-else>1.此订单任何情况下都不退款，请知悉。所有图片、文字仅供参考，专家个人研究数据，不保证连续性，不做任何承诺。自愿付费，谨慎下单！购买即接受协议，具有法律依据。</text>
                    <text class="tips-text tips-warn" v-if="fromOrder">(平台不会主动添加用户，不提供任何违法服务，所有私下交易均是骗子，谨防上当受骗)</text>
                    <text class="tips-link" v-if="fromOrder" @click.stop="openServiceTerms">《服务条款》</text>
                </view>
            </view>

            <!-- 3. Paid Content / Locked Card -->
            <view class="card content-card">
                <view class="badge-label red">付费内容</view>

                <!-- Unlocked Content -->
                <view v-if="canView" class="rich-content-box">
                    <rich-text :nodes="detail.content"></rich-text>
                </view>

                <!-- Locked State -->
                <view v-else class="locked-state" @click="showPay = true">
                    <view class="gift-icon-wrap">
                        <up-icon name="gift" size="60" color="#ffaa7f"></up-icon>
                    </view>
                    <text class="lock-tip">打赏解锁付费内容</text>
                </view>
            </view>

            <!-- 4. History Card -->
            <view class="card history-card">
                <view class="badge-label blue">往期记录</view>

                <view class="history-list" v-if="historyList && historyList.length > 0">
                    <view v-for="(item, index) in historyList" :key="index" class="history-item"
                        @click="loadDetail(item.id)">
                        <view class="h-title-row">
                            <text class="h-title">{{ item.title }}</text>
                        </view>

                        <view class="h-content-preview">
                            <rich-text :nodes="item.content"></rich-text>
                        </view>

                        <view class="stamp-mark" v-if="item.isWinner">
                            <view class="stamp-inner" :class="item.isWinner === 1 ? 'red' : 'black'">
                                <view class="stamp-text">{{ item.isWinner === 1 ? '红' : '黑' }}</view>
                            </view>
                        </view>

                        <view class="h-meta">
                            <text>发布于: {{ formatDate(item.createTime) }}</text>
                        </view>
                    </view>
                </view>

                <!-- Empty State -->
                <view v-else class="empty-history">
                    <up-empty mode="history" text="暂无历史数据" icon="">
                    </up-empty>
                </view>
            </view>
        </view>

        <!-- Fixed Bottom Bar (hide when from order or can view) -->
        <view class="bottom-bar" v-if="!fromOrder && !canView">
            <view class="price-info">
                付费解锁: <text class="price">{{ detail?.price || 0 }}元</text>
            </view>
            <view class="unlock-btn" @click="showPay = true">
                打赏 解锁
            </view>
        </view>

        <!-- Placeholders for safe area -->
        <view v-if="!fromOrder && !canView" style="height: 120rpx;"></view>

        <!-- Pay Sheet (hide when from order) -->
        <up-popup v-if="!fromOrder" :show="showPay" @close="showPay = false" mode="bottom" round="24">
            <view class="pay-sheet">
                <view class="sheet-title">确认支付</view>
                <view class="pay-amount">
                    <text class="unit">¥</text>
                    <text class="num">{{ detail?.price || 0 }}</text>
                </view>

                <view class="pay-options">
                    <up-radio-group v-model="payType" placement="column" iconPlacement="right" activeColor="#ff4757">
                        <!-- Balance Pay -->
                        <view class="pay-item" @click="payType = 'BALANCE'">
                            <view class="left">
                                <up-icon name="rmb-circle-fill" color="#ff9f43" size="28"></up-icon>
                                <view class="info">
                                    <text class="label">余额支付</text>
                                    <text class="sub">当前余额: ¥{{ userBalance }}</text>
                                </view>
                            </view>
                            <up-radio name="BALANCE" activeColor="#ff4757"></up-radio>
                        </view>

                        <!-- Alipay -->
                        <view class="pay-item" @click="payType = 'ALIPAY'">
                            <view class="left">
                                <up-icon name="zhifubao-circle-fill" color="#00A3EE" size="28"></up-icon>
                                <text class="label">支付宝</text>
                            </view>
                            <up-radio name="ALIPAY" activeColor="#ff4757"></up-radio>
                        </view>

                        <!-- WeChat Pay -->
                        <view class="pay-item" @click="payType = 'WECHAT'">
                            <view class="left">
                                <up-icon name="weixin-circle-fill" color="#07C160" size="28"></up-icon>
                                <text class="label">微信支付</text>
                            </view>
                            <up-radio name="WECHAT" activeColor="#ff4757"></up-radio>
                        </view>
                    </up-radio-group>
                </view>

                <up-button class="pay-btn" text="立即支付" :loading="loading"
                    customStyle="margin-top: 40rpx; height: 90rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; font-size: 32rpx; font-weight: bold; border-radius: 45rpx; border: none;"
                    @click="handlePay"></up-button>
            </view>
        </up-popup>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const detail = ref<any>(null);
const canView = ref(false);
const showPay = ref(false);
const fromOrder = ref(false);
const userBalance = ref('0.00');
const payType = ref('BALANCE');
const loading = ref(false);
const userId = uni.getStorageSync('userId');
const historyList = ref<any[]>([]);
const showTips = ref(true);
const contentId = ref('');
const isPolling = ref(false);

const formatDate = (timeStr: string) => {
    if (!timeStr) return '-';
    return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss');
};

const openServiceTerms = () => {
    uni.navigateTo({ url: '/pages/common/service-terms' });
};

const loadUserInfo = () => {
    if (!userId) return;
    request({
        url: `/user/info`
    }).then((res: any) => {
        if (res.data) {
            userBalance.value = res.data.balance ? Number(res.data.balance).toFixed(2) : '0.00';
        }
    });
};

const loadDetail = (id: string) => {
    request({
        url: `/content/${id}`,
        data: { userId }
    }).then((res: any) => {
        if (res.data) {
            detail.value = res.data;

            // Fix image size in rich text
            if (detail.value.content) {
                detail.value.content = detail.value.content.replace(/<img/gi, '<img style="max-width:100%;height:auto;display:block;"');
            }

            // Parse tags
            if (detail.value.tags && typeof detail.value.tags === 'string') {
                try {
                    detail.value.tagList = JSON.parse(detail.value.tags);
                } catch (e) {
                    detail.value.tagList = [];
                }
            } else if (Array.isArray(detail.value.tags)) {
                detail.value.tagList = detail.value.tags;
            } else {
                detail.value.tagList = [];
            }

            if (fromOrder.value) {
                canView.value = true;
            } else if (detail.value.isWinner && detail.value.isWinner !== 0) {
                canView.value = true;
            } else if (detail.value.price == 0 || detail.value.isPublic == 1 || detail.value.isPaid) {
                canView.value = true;
            }

            loadHistory(id);
        }
    });
};

const loadHistory = (id: string) => {
    request({
        url: `/content/history/${id}`
    }).then((res: any) => {
        if (Array.isArray(res.data)) {
            historyList.value = res.data;
        }
    });
};

const handlePay = () => {
    if (!detail.value) return;

    if (payType.value === 'BALANCE') {
        if (Number(userBalance.value) < Number(detail.value.price)) {
            uni.showModal({
                title: '余额不足',
                content: '您的余额不足，请先充值',
                confirmColor: '#ff4757',
                confirmText: '去充值',
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/user/recharge' });
                    }
                }
            });
            return;
        }
    }

    if (payType.value === 'WECHAT') {
        const ua = window.navigator.userAgent.toLowerCase();
        const isWechat = ua.indexOf('micromessenger') !== -1;
        if (!isWechat) {
            showPay.value = false;
            uni.showModal({
                title: '支付提示',
                content: '微信支付请在微信内置浏览器中打开',
                showCancel: false,
                confirmText: '知道了'
            });
            return;
        }
    }

    loading.value = true;
    request({
        url: '/pay/create',
        method: 'POST',
        data: {
            contentId: detail.value.id,
            payType: payType.value,
            amount: detail.value.price
        }
    }).then((res: any) => {
        loading.value = false;
        if (res.code === 200) {
            if (payType.value === 'BALANCE') {
                uni.showToast({ title: '支付成功', icon: 'success' });
                showPay.value = false;
                canView.value = true;
                fromOrder.value = true;
                loadDetail(detail.value.id);
            } else if (res.data && res.data.url) {
                // 保存待支付的 contentId
                uni.setStorageSync('pendingPayContentId', String(detail.value.id));
                // #ifdef APP-PLUS
                plus.runtime.openURL(res.data.url);
                // #endif
                // #ifdef H5
                let targetUrl = res.data.url;
                const ua = window.navigator.userAgent.toLowerCase();
                const isWechat = ua.indexOf('micromessenger') !== -1;
                if (isWechat && targetUrl.startsWith('alipays://')) {
                    const match = targetUrl.match(/qrcode=([^&]*)/);
                    if (match && match[1]) {
                        targetUrl = decodeURIComponent(match[1]);
                    }
                }
                window.location.href = targetUrl;
                // #endif

                showPay.value = false;
            }
        } else {
            uni.showToast({ title: res.msg || '支付失败', icon: 'none' });
        }
    }).catch(() => {
        loading.value = false;
        uni.showToast({ title: '网络异常', icon: 'none' });
    });
};

onLoad((options: any) => {
    const id = options.id;
    contentId.value = id;

    if (options.from === 'order') {
        fromOrder.value = true;
    }

    if (options.from === 'payment') {
        // returnUrl 返回，轮询等待支付回调完成
        fromOrder.value = true;
        uni.removeStorageSync('pendingPayContentId');
        pollPaymentResult(id);
    }

    // H5 浏览器返回时检测是否刚支付过
    const pendingId = uni.getStorageSync('pendingPayContentId');
    if (pendingId && String(pendingId) === String(id) && !fromOrder.value) {
        fromOrder.value = true;
        uni.removeStorageSync('pendingPayContentId');
        pollPaymentResult(id);
    }

    if (id) {
        loadDetail(id);
    }
    if (!fromOrder.value) {
        loadUserInfo();
    }
});

// 从外部支付切回时（App切换、H5 tab切回），onShow 会触发
onShow(() => {
    const pendingId = uni.getStorageSync('pendingPayContentId');
    if (pendingId && String(pendingId) === String(contentId.value) && !isPolling.value) {
        fromOrder.value = true;
        uni.removeStorageSync('pendingPayContentId');
        pollPaymentResult(String(pendingId));
        // 同时重新加载详情（可能回调已经处理完了）
        loadDetail(String(pendingId));
    }
});

// 支付完成后轮询检查订单状态
const pollPaymentResult = (cId: string) => {
    if (isPolling.value) return;
    isPolling.value = true;

    let attempts = 0;
    const maxAttempts = 15;
    const interval = 2000;

    const check = () => {
        attempts++;
        request({ url: `/content/${cId}` }).then((res: any) => {
            if (res.code === 200) {
                const content = res.data;
                if (content.content && !content.content.includes('付费解锁')) {
                    if (content.content) {
                        content.content = content.content.replace(/<img/gi, '<img style="max-width:100%;height:auto;display:block;"');
                    }
                    detail.value = content;
                    canView.value = true;
                    isPolling.value = false;
                    uni.showToast({ title: '支付成功', icon: 'success' });
                    return;
                }
            }
            if (attempts < maxAttempts) {
                setTimeout(check, interval);
            } else {
                isPolling.value = false;
                uni.showToast({ title: '支付处理中，请下拉刷新', icon: 'none' });
            }
        }).catch(() => {
            isPolling.value = false;
        });
    };

    setTimeout(check, interval);
};
</script>

<style lang="scss" scoped>
page {
    background-color: #f7f8fa;
}

.container {
    padding-bottom: 200rpx;
}

.main-content {
    padding: 24rpx;
}

.card {
    background: #fff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

// 1. Title Card
.title-card {
    position: relative;
    padding-right: 150rpx !important; // Reserve space for stamp

    .status-badges {
        display: flex;
        gap: 12rpx;
        margin-bottom: 16rpx;

        .status-tag {
            font-size: 20rpx;
            color: #fff;
            padding: 4rpx 16rpx;
            border-radius: 6rpx;
            font-weight: bold;

            &.green {
                background: #52c41a;
            }

            &.orange {
                background: #ff8c42;
            }
        }
    }

    .title-row {
        margin-bottom: 16rpx;
        display: flex; // Enable Flex
        align-items: center;
        flex-wrap: wrap; // Allow wrapping

        .title {
            font-size: 32rpx;
            font-weight: bold;
            color: #333;
            line-height: 1.5;
            margin-right: 8rpx; // Space for icon/tags
            word-break: break-all; // Ensure long words wrap
        }

        .tags {
            display: inline-flex;
            align-items: center;
            margin-left: 0; // Reset margin since we have flex gap/margin on title

            .tag {
                margin-right: 8rpx;

                &.text-tag {
                    background: #ff4757;
                    color: #fff;
                    font-size: 20rpx;
                    padding: 2rpx 8rpx;
                    border-radius: 4rpx;
                }
            }
        }
    }

    .time-row {
        font-size: 24rpx;
        color: #999;
    }

    .public-time-row {
        margin-top: 12rpx;

        .time-divider {
            height: 1rpx;
            background: #f0f0f0;
            margin-bottom: 12rpx;
        }

        .public-time {
            font-size: 24rpx;
            color: #ff8c42;
        }
    }

    .status-stamp {
        position: absolute;
        right: 32rpx;
        top: 32rpx;
        transform: rotate(15deg);
        z-index: 10;

        .stamp-inner {
            width: 80rpx;
            height: 80rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 4rpx solid;
            position: relative;

            &::after {
                content: '';
                position: absolute;
                top: 4rpx;
                left: 4rpx;
                right: 4rpx;
                bottom: 4rpx;
                border: 2rpx dashed;
                border-radius: 50%;
            }

            .stamp-text {
                font-size: 32rpx;
                font-weight: bold;
            }

            &.red {
                color: #ff4757;
                border-color: rgba(255, 71, 87, 0.4);

                &::after {
                    border-color: rgba(255, 71, 87, 0.3);
                }
            }

            &.black {
                color: #999;
                border-color: rgba(153, 153, 153, 0.4);

                &::after {
                    border-color: rgba(153, 153, 153, 0.3);
                }
            }
        }
    }
}

// 2. Tips Card (Collapsible)
.tips-card {
    padding: 24rpx 32rpx;

    .tips-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .tips-title {
            font-size: 26rpx;
            color: #ff8c42;
            font-weight: bold;
        }

        .tips-toggle {
            font-size: 24rpx;
            color: #999;

            .arrow {
                font-size: 20rpx;
                margin-left: 4rpx;
            }
        }
    }

    .tips-body {
        margin-top: 20rpx;
        padding-top: 20rpx;
        border-top: 1rpx solid #f5f5f5;

        .tips-text {
            display: block;
            font-size: 24rpx;
            color: #666;
            line-height: 1.8;
            text-align: justify;
        }

        .tips-warn {
            color: #ff4757;
            margin-top: 12rpx;
        }

        .tips-link {
            display: inline-block;
            font-size: 24rpx;
            color: #2e86de;
            margin-top: 16rpx;
        }
    }
}

// 3. Content Card
.content-card {
    min-height: 200rpx;
    display: flex;
    flex-direction: column;

    .badge-label {
        align-self: flex-start;
        background: #ff4757;
        color: #fff;
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        margin-bottom: 20rpx;
    }

    .locked-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20rpx 0;

        .gift-icon-wrap {
            margin-bottom: 24rpx;
        }

        .lock-tip {
            font-size: 32rpx;
            color: #ff8c42;
            font-weight: bold;
        }
    }

    .rich-content-box {
        font-size: 28rpx;
        color: #333;
        line-height: 1.8;
        word-break: break-all;
        overflow: hidden;

        /* Handle images in rich-text */
        :deep(img) {
            max-width: 100% !important;
            height: auto !important;
            display: block;
            margin: 10rpx 0;
        }

        /* Fallback for nodes that might not support :deep in all environments */
        img {
            max-width: 100% !important;
            height: auto !important;
        }
    }
}

// 4. History Card
.history-card {
    .badge-label {
        display: inline-block;
        background: #2e86de; // Blue
        color: #fff;
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        margin-bottom: 24rpx;
    }

    .history-item {
        border-bottom: 2rpx dashed #dcdfe6;
        padding: 30rpx 0;
        padding-right: 120rpx; // Reserve space for stamp
        position: relative;

        &:last-child {
            border-bottom: none;
        }

        .h-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .h-title {
            font-size: 28rpx;
            color: #333;
            flex: 1;
            margin-right: 16rpx;
        }

        .h-content-preview {
            margin: 16rpx 0;
            font-size: 28rpx;
            font-weight: 500;
            color: #ff8c42;
            line-height: 1.5;
            word-break: break-all;
            width: 100%;
            overflow: hidden;

            :deep(img) {
                max-width: 100% !important;
                height: auto !important;
                display: block;
            }
        }

        .h-meta {
            font-size: 24rpx;
            color: #999;
            text-align: right;
        }

        .stamp-mark {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%) rotate(15deg);
            flex-shrink: 0;
            opacity: 0.9;

            .stamp-inner {
                width: 60rpx;
                height: 60rpx;
                border: 2rpx solid;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;

                &::after {
                    content: '';
                    position: absolute;
                    top: 3rpx;
                    left: 3rpx;
                    right: 3rpx;
                    bottom: 3rpx;
                    border: 1rpx dashed;
                    border-radius: 50%;
                }

                .stamp-text {
                    font-size: 24rpx;
                    font-weight: bold;
                }

                &.red {
                    color: #ff4757;
                    border-color: rgba(255, 71, 87, 0.4);

                    &::after {
                        border-color: rgba(255, 71, 87, 0.3);
                    }
                }

                &.black {
                    color: #999;
                    border-color: rgba(153, 153, 153, 0.4);

                    &::after {
                        border-color: rgba(153, 153, 153, 0.3);
                    }
                }
            }
        }
    }
}

// Bottom Bar
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 110rpx;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
    z-index: 100;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);

    .price-info {
        font-size: 28rpx;
        color: #333;
        font-weight: bold;

        .price {
            font-size: 36rpx;
            color: #ff4757;
            margin-left: 8rpx;
        }
    }

    .unlock-btn {
        background: #ff5e57;
        color: #fff;
        padding: 16rpx 60rpx;
        border-radius: 8rpx;
        font-size: 30rpx;
        font-weight: bold;
        box-shadow: 0 4rpx 12rpx rgba(255, 94, 87, 0.3);
    }
}

.pay-sheet {
    padding: 32rpx;
    background: #fff;
    border-top-left-radius: 24rpx;
    border-top-right-radius: 24rpx;

    .sheet-title {
        font-size: 32rpx;
        font-weight: bold;
        text-align: center;
        margin-bottom: 20rpx;
        padding-top: 20rpx;
    }

    .pay-amount {
        font-size: 56rpx;
        color: #ff4757;
        font-weight: bold;
        text-align: center;
        margin-bottom: 40rpx;
        font-family: 'Helvetica Neue', sans-serif;

        .unit {
            font-size: 32rpx;
            margin-right: 4rpx;
        }
    }

    .pay-options {
        .pay-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 30rpx 0;
            border-bottom: 1rpx solid #f5f5f5;

            &:last-child {
                border-bottom: none;
            }

            .left {
                display: flex;
                align-items: center;
                flex: 1;

                .info {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    margin-left: 20rpx;

                    .label {
                        font-size: 30rpx;
                        color: #333;
                        line-height: 1.2;
                    }

                    .sub {
                        font-size: 24rpx;
                        color: #999;
                        margin-top: 8rpx;
                    }
                }

                // If no .info, direct text
                &>text {
                    margin-left: 20rpx;
                    font-size: 30rpx;
                    color: #333;
                    line-height: 1.2;
                }
            }
        }
    }
}
</style>
