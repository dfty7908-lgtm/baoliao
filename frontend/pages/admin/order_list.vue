<template>
    <view class="container">
        <view class="tabs-wrap">
            <up-tabs :list="tabList" @click="handleTabClick" :current="currentTab" lineColor="#ff4757"
                activeStyle="color: #ff4757; font-weight: bold;"></up-tabs>
        </view>

        <!-- Content Orders List -->
        <view v-if="currentTab === 0" class="list-content">
            <view class="order-item" v-for="order in list" :key="order.id">
                <view class="card-top">
                    <view class="order-no-wrap">
                        <text class="label">订单号</text>
                        <text class="number">{{ order.orderNo }}</text>
                    </view>
                    <view class="status-badge" :class="{ paid: order.status === 1 }">
                        {{ order.status === 0 ? '待支付' : order.status === 1 ? '已交易' : '已取消' }}
                    </view>
                </view>

                <view class="card-middle">
                    <view class="info-left">
                        <text class="title">{{ order.snapshot ? JSON.parse(order.snapshot).title : '内容购买' }}</text>
                        <view class="meta">
                            <text class="time">{{ order.createTime.replace('T', ' ') }}</text>
                            <text class="user-id">用户: {{ order.userId }}</text>
                        </view>
                    </view>
                    <view class="price-right">
                        <text class="symbol">¥</text>
                        <text class="amount">{{ order.amount }}</text>
                    </view>
                </view>

                <view class="card-bottom">
                    <view class="badges-row">
                        <view class="pay-badge" v-if="order.payType" :class="order.payType.toLowerCase()">
                            <up-icon :name="order.payType === 'ALIPAY' ? 'zhifubao-circle-fill' : 'weixin-circle-fill'"
                                :color="order.payType === 'ALIPAY' ? '#00A3EE' : '#07C160'" size="14"></up-icon>
                            <text>{{ order.payType === 'ALIPAY' ? '支付宝' : '微信支付' }}</text>
                        </view>
                    </view>
                    <view class="action-btn delete" @click="confirmDeleteOrder(order.id)">
                        <up-icon name="trash" size="16" color="#ff4757"></up-icon>
                        <text>删除</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- Recharge Records List -->
        <view v-else class="list-content">
            <view class="order-item recharge" v-for="item in rechargeList" :key="item.id">
                <view class="card-top">
                    <view class="order-no-wrap">
                        <text class="label">流水号</text>
                        <text class="number">{{ item.rechargeNo }}</text>
                    </view>
                    <view class="status-badge" :class="{ paid: item.status === 1 }">
                        {{ item.status === 0 ? '充值中' : item.status === 1 ? '充值成功' : '失败' }}
                    </view>
                </view>

                <view class="card-middle">
                    <view class="info-left">
                        <text class="title">余额充值</text>
                        <view class="meta">
                            <text class="time">{{ item.createTime.replace('T', ' ') }}</text>
                            <text class="user-id">用户: {{ item.userId }}</text>
                        </view>
                    </view>
                    <view class="price-right highlight">
                        <text class="symbol">+</text>
                        <text class="amount">{{ item.amount }}</text>
                    </view>
                </view>

                <view class="card-bottom">
                    <view class="badges-row">
                        <view class="pay-badge" v-if="item.payType" :class="item.payType.toLowerCase()">
                            <up-icon :name="item.payType === 'ALIPAY' ? 'zhifubao-circle-fill' : 'weixin-circle-fill'"
                                :color="item.payType === 'ALIPAY' ? '#00A3EE' : '#07C160'" size="14"></up-icon>
                            <text>{{ item.payType === 'ALIPAY' ? '支付宝' : '微信支付' }}</text>
                        </view>
                    </view>
                    <view class="action-btn delete" @click="confirmDeleteRecharge(item.id)">
                        <up-icon name="trash" size="16" color="#ff4757"></up-icon>
                        <text>删除</text>
                    </view>
                </view>
            </view>
        </view>

        <up-loadmore :status="loadStatus" @loadmore="loadMore"></up-loadmore>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const tabList = [{ name: '内容订单' }, { name: '充值记录' }];
const currentTab = ref(0);
const list = ref<any[]>([]);
const rechargeList = ref<any[]>([]);
const page = ref(1);
const loadStatus = ref('loadmore');

onLoad(() => {
    loadList();
});

const handleTabClick = (item: any) => {
    currentTab.value = item.index;
    page.value = 1;
    list.value = [];
    rechargeList.value = [];
    loadList();
};

onReachBottom(() => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadList();
    }
});

const loadMore = () => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadList();
    }
};

const confirmDeleteOrder = (id: number) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这条订单记录吗？',
        confirmColor: '#ff4757',
        success: (res) => {
            if (res.confirm) {
                request({ url: `/order/${id}`, method: 'DELETE' }).then(() => {
                    uni.showToast({ title: '已删除' });
                    list.value = list.value.filter((o: any) => o.id !== id);
                });
            }
        }
    });
};

const confirmDeleteRecharge = (id: number) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这条充值记录吗？',
        confirmColor: '#ff4757',
        success: (res) => {
            if (res.confirm) {
                request({ url: `/recharge/${id}`, method: 'DELETE' }).then(() => {
                    uni.showToast({ title: '已删除' });
                    rechargeList.value = rechargeList.value.filter((o: any) => o.id !== id);
                });
            }
        }
    });
};

const loadList = () => {
    loadStatus.value = 'loading';
    const url = currentTab.value === 0 ? '/order/admin/list' : '/recharge/admin/list';

    request({
        url,
        data: { page: page.value, size: 20 }
    }).then((res: any) => {
        const records = res.data.records || [];
        if (currentTab.value === 0) {
            list.value = page.value === 1 ? records : [...list.value, ...records];
        } else {
            rechargeList.value = page.value === 1 ? records : [...rechargeList.value, ...records];
        }
        loadStatus.value = records.length < 20 ? 'nomore' : 'loadmore';
    });
};
</script>

<style lang="scss" scoped>
.container {
    background-color: #f7f8fa;
    min-height: 100vh;
}

.tabs-wrap {
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

.list-content {
    padding: 24rpx;
}

.order-item {
    background: #fff;
    border-radius: 28rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
    border: 1rpx solid #efefef;

    .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24rpx;
        padding-bottom: 16rpx;
        border-bottom: 1rpx solid #f8f8f8;

        .order-no-wrap {
            display: flex;
            align-items: center;

            .label {
                font-size: 20rpx;
                color: #bbb;
                background: #f5f5f5;
                padding: 2rpx 8rpx;
                border-radius: 4rpx;
                margin-right: 12rpx;
            }

            .number {
                font-size: 24rpx;
                color: #999;
                font-family: 'Courier New', Courier, monospace;
            }
        }

        .status-badge {
            font-size: 22rpx;
            color: #ff9f43;
            font-weight: bold;
            padding: 4rpx 12rpx;
            background: rgba(255, 159, 67, 0.1);
            border-radius: 8rpx;

            &.paid {
                color: #52c41a;
                background: rgba(82, 196, 26, 0.1);
            }
        }
    }

    .card-middle {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 28rpx;

        .info-left {
            flex: 1;
            margin-right: 20rpx;

            .title {
                font-size: 30rpx;
                font-weight: bold;
                color: #333;
                line-height: 1.4;
                margin-bottom: 12rpx;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
            }

            .meta {
                display: flex;
                flex-direction: column;
                gap: 4rpx;

                .time {
                    font-size: 22rpx;
                    color: #ccc;
                }

                .user-id {
                    font-size: 22rpx;
                    color: #aaa;
                    font-weight: 500;
                }
            }
        }

        .price-right {
            display: flex;
            align-items: baseline;
            color: #333;

            .symbol {
                font-size: 24rpx;
                font-weight: bold;
                margin-right: 4rpx;
            }

            .amount {
                font-size: 40rpx;
                font-weight: 900;
                font-family: 'DIN Alternate', sans-serif;
            }

            &.highlight {
                color: #ff4757;
            }
        }
    }

    .card-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .badges-row {
            display: flex;
            gap: 12rpx;

            .pay-badge {
                display: flex;
                align-items: center;
                gap: 6rpx;
                font-size: 20rpx;
                color: #666;
                background: #f8f9fb;
                padding: 6rpx 16rpx;
                border-radius: 100rpx;
                border: 1rpx solid #f0f0f0;

                &.alipay {
                    color: #00A3EE;
                    background: rgba(0, 163, 238, 0.05);
                    border-color: rgba(0, 163, 238, 0.1);
                }

                &.wechat {
                    color: #07C160;
                    background: rgba(7, 193, 96, 0.05);
                    border-color: rgba(7, 193, 96, 0.1);
                }
            }
        }

        .action-btn {
            display: flex;
            align-items: center;
            gap: 6rpx;
            padding: 10rpx 20rpx;
            border-radius: 12rpx;
            transition: all 0.2s;

            &.delete {
                background: #fff;
                border: 1rpx solid #feeaea;

                text {
                    font-size: 24rpx;
                    color: #ff4757;
                    font-weight: 500;
                }

                &:active {
                    background: #fff5f5;
                }
            }
        }
    }

    &.recharge {
        border-left: 8rpx solid #ff4757;
    }
}
</style>
