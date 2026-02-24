<template>
    <view class="container">
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
            <up-empty mode="list" text="暂无账单记录"></up-empty>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const billList = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);
const loading = ref(false);

onLoad(() => {
    loadBills();
});

onReachBottom(() => {
    if (hasMore.value && !loading.value) {
        loadBills();
    }
});

const loadBills = () => {
    if (loading.value) return;
    loading.value = true;

    request({
        url: '/user/bills',
        data: {
            page: page.value,
            size: pageSize.value
        }
    }).then((res: any) => {
        loading.value = false;
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
        loading.value = false;
        uni.showToast({ title: '加载失败', icon: 'none' });
    });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
    padding: 20rpx;
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

    &:last-child {
        border-bottom: none;
    }

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
    padding-top: 200rpx;
    display: flex;
    justify-content: center;
}
</style>
