<template>
    <view class="container">
        <!-- Custom Gradient Header -->
        <view class="custom-header">
            <view class="tab-box">
                <view class="tab-item" :class="{ active: currentTab === 'recharge' }" @click="currentTab = 'recharge'">
                    余额充值</view>
                <view class="tab-item" :class="{ active: currentTab === 'records' }"
                    @click="handleTabChange('records')">充值记录</view>
            </view>
        </view>

        <!-- Main Body -->
        <view class="main-body" v-if="currentTab === 'recharge'">
            <!-- Notice Box -->
            <view class="notice-box">
                <view class="text">· 积分充值后无特殊原因不可退款。</view>
                <view class="text">· 充值后如十分钟内未到账余额，请联系客服处理。</view>
            </view>

            <view class="balance-card">
                <text class="label">账户余额</text>
                <text class="value">{{ balance }} 元</text>
            </view>

            <view class="amount-section">
                <view class="amount-grid">
                    <view v-for="(item, index) in amounts" :key="index" class="amount-item"
                        :class="{ active: selectedAmount === item }" @click="selectedAmount = item">
                        <text class="num">{{ item }} 元</text>
                    </view>
                </view>

                <view class="input-section">
                    <view class="label">充值金额</view>
                    <view class="input-wrap">
                        <text class="symbol">¥</text>
                        <input type="number" v-model="selectedAmount" placeholder="请输入充值金额" />
                    </view>
                </view>
            </view>

            <view class="pay-section">
                <view class="section-title">付款方式</view>
                <view class="pay-list">
                    <up-radio-group v-model="payType" placement="column" iconPlacement="right" activeColor="#ff4757">
                        <view class="pay-item" @click="payType = 'ALIPAY'">
                            <view class="left">
                                <up-icon name="zhifubao-circle-fill" color="#00A3EE" size="28"></up-icon>
                                <text>支付宝</text>
                            </view>
                            <up-radio name="ALIPAY" activeColor="#ff4757"></up-radio>
                        </view>
                        <view class="pay-item" @click="payType = 'WECHAT'">
                            <view class="left">
                                <up-icon name="weixin-circle-fill" color="#07C160" size="28"></up-icon>
                                <text>微信支付</text>
                            </view>
                            <up-radio name="WECHAT" activeColor="#ff4757"></up-radio>
                        </view>
                    </up-radio-group>
                </view>
            </view>

            <view class="footer-btn">
                <up-button :loading="loading" text="立即支付"
                    customStyle="height: 100rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; font-size: 32rpx; font-weight: bold; border-radius: 50rpx; border: none;"
                    @click="handleRecharge"></up-button>
            </view>
        </view>

        <!-- Records Tab -->
        <view class="records-body" v-else>
            <view class="bill-list" v-if="billList.length > 0">
                <view v-for="(item, index) in billList" :key="index" class="bill-item">
                    <view class="item-left">
                        <view class="title">{{ item.description || '账户变动' }}</view>
                        <view class="time">{{ item.createTime }}</view>
                    </view>
                    <view class="item-right" :class="{ plus: item.amount > 0 }">
                        {{ item.amount > 0 ? '+' : '' }}{{ item.amount.toFixed(2) }}
                    </view>
                </view>
            </view>
            <view v-else class="empty-state">
                <up-icon name="order" size="60" color="#ddd"></up-icon>
                <text>暂无记录</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import dayjs from 'dayjs';
import { onReachBottom } from '@dcloudio/uni-app';

const balance = ref('0.00');
const amounts = [88, 188, 588, 888, 1288, 2000];
const selectedAmount = ref(88);
const payType = ref('ALIPAY');
const loading = ref(false);
const currentTab = ref('recharge');
const billList = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const hasMore = ref(true);
const listLoading = ref(false);

const loadUserInfo = () => {
    request({
        url: `/user/info`
    }).then((res: any) => {
        if (res.data) {
            balance.value = res.data.balance ? Number(res.data.balance).toFixed(2) : '0.00';
        }
    });
};

const handleTabChange = (tab: string) => {
    currentTab.value = tab;
    if (tab === 'records') {
        page.value = 1;
        billList.value = [];
        hasMore.value = true;
        loadBills();
    }
};

const loadBills = () => {
    if (!hasMore.value || listLoading.value) return;

    listLoading.value = true;
    request({
        url: '/user/bills',
        data: {
            page: page.value,
            size: pageSize.value,
            type: 'RECHARGE'
        }
    }).then((res: any) => {
        listLoading.value = false;
        if (res.code === 200 && res.data) {
            const records = (res.data.records || []).map((item: any) => ({
                ...item,
                createTime: item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'
            }));
            if (page.value === 1) {
                billList.value = records;
            } else {
                billList.value = [...billList.value, ...records];
            }

            if (records.length < pageSize.value) {
                hasMore.value = false;
            } else {
                page.value++;
            }
        }
    }).catch(() => {
        listLoading.value = false;
    });
};

onReachBottom(() => {
    if (currentTab.value === 'records') {
        loadBills();
    }
});

onLoad((options: any) => {
    if (options.tab === 'records') {
        handleTabChange('records');
    }
});

onShow(() => {
    loadUserInfo();

    // 从支付返回时检测：如果有 pendingRechargeOrderNo，跳转到结果页
    const pendingOrderNo = uni.getStorageSync('pendingRechargeOrderNo');
    if (pendingOrderNo) {
        // 不清除，让 recharge-result 页面去清除和轮询
        uni.navigateTo({
            url: '/pages/user/recharge-result'
        });
    }
});

const handleRecharge = () => {
    if (!selectedAmount.value || Number(selectedAmount.value) <= 0) {
        uni.showToast({ title: '请输入有效金额', icon: 'none' });
        return;
    }

    if (payType.value === 'WECHAT') {
        const ua = window.navigator.userAgent.toLowerCase();
        const isWechat = ua.indexOf('micromessenger') !== -1;
        if (!isWechat) {
            uni.showModal({
                title: '支付提示',
                content: '微信支付请在微信内置浏览器中打开',
                showCancel: false,
                confirmText: '知道了',
                confirmColor: '#ff4757',
            });
            return;
        }
    }

    loading.value = true;
    request({
        url: '/recharge/create',
        method: 'POST',
        data: {
            amount: Number(selectedAmount.value),
            payType: payType.value
        }
    }).then((res: any) => {
        loading.value = false;
        if (res.code === 200 && res.data) {
            const payData = res.data;
            if (payData.url) {
                // 保存充值订单号（与内容购买的 pendingPayContentId 完全独立）
                if (payData.orderNo) {
                    uni.setStorageSync('pendingRechargeOrderNo', payData.orderNo);
                }

                // #ifdef APP-PLUS
                plus.runtime.openURL(payData.url);
                // #endif
                // #ifdef H5
                let targetUrl = payData.url;
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
            } else {
                uni.showToast({ title: '创建支付失败', icon: 'none' });
            }
        } else {
            uni.showToast({ title: res.msg || '失败', icon: 'none' });
        }
    }).catch((err: any) => {
        loading.value = false;
        uni.showToast({ title: err.message || '网络异常', icon: 'none' });
    });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
}

.custom-header {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    padding-bottom: 30rpx;
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;
}

.tab-box {
    display: flex;
    justify-content: center;
    margin-top: 20rpx;

    .tab-item {
        margin: 0 40rpx;
        font-size: 30rpx;
        color: rgba(255, 255, 255, 0.7);
        padding-bottom: 12rpx;
        position: relative;

        &.active {
            color: #fff;
            font-weight: bold;

            &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 32rpx;
                height: 4rpx;
                background: #fff;
                border-radius: 2rpx;
            }
        }
    }
}

.notice-box {
    background: #fffbe6;
    border: 1rpx solid #ffe58f;
    padding: 24rpx 30rpx;
    margin: 30rpx;
    border-radius: 12rpx;

    .text {
        font-size: 24rpx;
        color: #fa8c16;
        line-height: 1.6;
    }
}

.main-body,
.records-body {
    padding: 0 30rpx 60rpx;
}

.records-body {
    padding-top: 30rpx;
}

.balance-card {
    background: #fff;
    padding: 40rpx;
    border-radius: 16rpx;
    margin-bottom: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);

    .label {
        font-size: 30rpx;
        color: #333;
    }

    .value {
        font-size: 38rpx;
        color: #ff4757;
        font-weight: 800;
    }
}

.amount-section {
    background: #fff;
    padding: 40rpx;
    border-radius: 16rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
}

.amount-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-bottom: 40rpx;

    .amount-item {
        width: calc(33.33% - 14rpx);
        height: 100rpx;
        background: #fdfdfd;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2rpx solid #efefef;
        transition: all 0.2s;

        &.active {
            background: rgba(255, 71, 87, 0.05);
            border-color: #ff4757;

            .num {
                color: #ff4757;
                font-weight: bold;
            }
        }
    }
}

.input-section {
    .label {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 20rpx;
    }

    .input-wrap {
        display: flex;
        align-items: center;
        height: 100rpx;
        background: #f8f8f8;
        border-radius: 12rpx;
        padding: 0 30rpx;

        .symbol {
            font-size: 36rpx;
            color: #ff4757;
            margin-right: 12rpx;
            font-weight: bold;
        }

        input {
            flex: 1;
            font-size: 32rpx;
            color: #ff4757;
            font-weight: bold;
        }
    }
}

.pay-section {
    background: #fff;
    padding: 40rpx;
    border-radius: 16rpx;
    margin-bottom: 40rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);

    .section-title {
        font-size: 28rpx;
        color: #999;
        margin-bottom: 30rpx;
    }
}

.pay-list {
    .pay-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24rpx 0;
        border-bottom: 1rpx solid #fcfcfc;

        &:last-child {
            border-bottom: none;
        }

        .left {
            display: flex;
            align-items: center;

            text {
                margin-left: 20rpx;
                font-size: 30rpx;
                color: #333;
            }
        }
    }
}

.bill-list {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
}

.bill-item {
    padding: 30rpx 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid #fafafa;

    .title {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 8rpx;
    }

    .time {
        font-size: 22rpx;
        color: #bbb;
    }

    .item-right {
        font-size: 32rpx;
        font-weight: 800;
        color: #333;

        &.plus {
            color: #ff4757;
        }
    }
}

.empty-state {
    padding-top: 150rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #ccc;
    font-size: 28rpx;

    text {
        margin-top: 20rpx;
    }
}

.footer-btn {
    padding-bottom: 40rpx;
}
</style>
