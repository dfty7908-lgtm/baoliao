<template>
    <view class="container">
        <view class="custom-header">
            <view class="tab-header">
                <view class="tab-item active">买入的订单</view>
            </view>

            <view class="search-box">
                <up-search placeholder="请输入搜索关键词" :showAction="false" shape="square" background="#fff"
                    border-color="transparent"></up-search>
            </view>
        </view>

        <view class="content">
            <view v-if="firstLoading" class="loading-state">
                <up-loading-icon mode="circle"></up-loading-icon>
            </view>
            <view v-else-if="orders && orders.length > 0" class="order-list">
                <view class="order-item" v-for="order in orders" :key="order.id" @click="viewDetail(order)">
                    <view class="order-header">
                        <view class="order-no">订单号：{{ order.orderNo }}</view>
                        <view class="order-status" :class="'status-' + order.status">
                            {{ order.status === 0 ? '待支付' : order.status === 1 ? '已支付' : '已取消' }}
                        </view>
                    </view>

                    <view class="order-content" v-if="order.parsedSnapshot">
                        <view class="content-title">
                            {{ order.parsedSnapshot.title }}
                        </view>
                    </view>

                    <view class="order-footer">
                        <view class="order-time">{{ order.createTime }}</view>
                        <view class="order-amount">¥{{ order.amount }}</view>
                    </view>
                </view>

                <!-- 加载状态提示 -->
                <view class="load-status">
                    <view v-if="loading" class="load-tip">
                        <up-loading-icon size="20" color="#999"></up-loading-icon>
                        <text class="load-text">加载中...</text>
                    </view>
                    <view v-else-if="isFinished" class="load-tip">
                        <text class="load-text">— 已加载全部订单 —</text>
                    </view>
                </view>
            </view>
            <view v-else class="empty-state">
                <up-icon name="grid" size="60" color="#eee"></up-icon>
                <text class="empty-text">暂无数据</text>
                <up-button text="前往首页浏览"
                    customStyle="width: 280rpx; height: 72rpx; margin-top: 40rpx; border-radius: 36rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; border: none;"
                    @click="goHome"></up-button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { getMyOrders } from '@/api/order';
import dayjs from 'dayjs';

const orders = ref<any[]>([]);
const loading = ref(false);
const firstLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const isFinished = ref(false);

const parseSnapshot = (snapshot: any) => {
    if (!snapshot) return { title: '暂无标题' };
    try {
        return typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
    } catch (e) {
        console.error('解析快照失败:', e);
        return { title: '数据解析失败' };
    }
};

const parseOrder = (order: any) => ({
    ...order,
    createTime: order.createTime ? dayjs(order.createTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    parsedSnapshot: parseSnapshot(order.snapshot)
});

// 获取订单列表（支持分页追加）
const fetchOrders = async (isLoadMore = false) => {
    if (loading.value) return;
    if (isLoadMore && isFinished.value) return;

    try {
        loading.value = true;
        if (!isLoadMore) {
            firstLoading.value = orders.value.length === 0;
            currentPage.value = 1;
            isFinished.value = false;
        }

        const userInfo = uni.getStorageSync('userInfo');
        if (!userInfo || !userInfo.id) {
            uni.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        const res = await getMyOrders({
            page: currentPage.value,
            size: pageSize.value
        });

        if (res.code === 200 && res.data) {
            const records = (res.data.records || []).map(parseOrder);
            total.value = res.data.total || 0;

            if (isLoadMore) {
                orders.value = [...orders.value, ...records];
            } else {
                orders.value = records;
            }

            if (orders.value.length >= total.value || records.length < pageSize.value) {
                isFinished.value = true;
            }
        }
    } catch (error) {
        console.error('获取订单列表失败:', error);
        uni.showToast({ title: '获取订单失败', icon: 'none' });
    } finally {
        loading.value = false;
        firstLoading.value = false;
    }
};

const goHome = () => {
    uni.switchTab({ url: '/pages/index/index' });
};

// 查看订单详情 — 已支付订单复用内容详情页
const viewDetail = (order: any) => {
    if (order.status !== 1) {
        uni.showToast({ title: '该订单未完成支付', icon: 'none' });
        return;
    }
    uni.navigateTo({
        url: `/pages/content/detail?id=${order.contentId}&from=order`
    });
};

// 触底加载更多
onReachBottom(() => {
    if (!isFinished.value && !loading.value) {
        currentPage.value++;
        fetchOrders(true);
    }
});

// 下拉刷新
onPullDownRefresh(() => {
    fetchOrders(false);
    const timer = setInterval(() => {
        if (!loading.value) {
            clearInterval(timer);
            uni.stopPullDownRefresh();
        }
    }, 200);
});

onShow(() => {
    fetchOrders(false);
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

.tab-header {
    display: flex;
    justify-content: center;
    padding: 20rpx 0 30rpx;

    .tab-item {
        font-size: 34rpx;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;

        &.active {
            color: #fff;
            font-weight: 800;
            font-size: 36rpx;
            position: relative;

            &::after {
                content: '';
                display: block;
                width: 40rpx;
                height: 4rpx;
                background: #fff;
                margin: 8rpx auto 0;
                border-radius: 2rpx;
            }
        }
    }
}

.search-box {
    padding: 0 30rpx 20rpx;
    margin-bottom: 0;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding-top: 150rpx;
}

.order-list {
    padding: 20rpx 30rpx;
}

.order-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .order-no {
        font-size: 24rpx;
        color: #999;
    }

    .order-status {
        font-size: 24rpx;
        padding: 6rpx 16rpx;
        border-radius: 20rpx;

        &.status-0 {
            color: #ff8c42;
            background: rgba(255, 140, 66, 0.1);
        }

        &.status-1 {
            color: #52c41a;
            background: rgba(82, 196, 26, 0.1);
        }

        &.status-2 {
            color: #999;
            background: rgba(0, 0, 0, 0.05);
        }
    }
}

.order-content {
    margin-bottom: 20rpx;

    .content-title {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        line-height: 40rpx;
    }
}

.order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .order-time {
        font-size: 24rpx;
        color: #999;
    }

    .order-amount {
        font-size: 32rpx;
        color: #ff4757;
        font-weight: 600;
    }
}

.load-status {
    padding: 30rpx 0 60rpx;
    text-align: center;

    .load-tip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10rpx;
    }

    .load-text {
        font-size: 26rpx;
        color: #ccc;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 150rpx;

    .empty-icon-wrap {
        width: 140rpx;
        height: 140rpx;
        background: #eee;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        color: #999;
    }
}
</style>
