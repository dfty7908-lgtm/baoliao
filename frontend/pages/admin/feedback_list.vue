<template>
    <view class="container">
        <!-- Tabs -->
        <up-tabs :list="tabs" :current="currentTab" @click="handleTabChange" lineColor="#ff4757"
            activeColor="#ff4757"></up-tabs>

        <!-- List -->
        <view class="list-wrap">
            <view class="item" v-for="(item, index) in list" :key="index" @click="goDetail(item)">
                <view class="header">
                    <text class="time">{{ item.createTime }}</text>
                    <text class="status" :class="{ 'replied': item.status === 1 }">
                        {{ item.status === 1 ? '已回复' : '待处理' }}
                    </text>
                </view>
                <view class="content u-line-2">{{ item.content }}</view>
                <view class="footer">
                    <text class="contact">联系方式: {{ item.contact || '无' }}</text>
                </view>
            </view>
            <up-loadmore :status="loadStatus" @loadmore="loadData"></up-loadmore>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const tabs = [
    { name: '全部', value: null },
    { name: '待处理', value: 0 },
    { name: '已回复', value: 1 }
];
const currentTab = ref(0);
const list = ref<any[]>([]);
const page = ref(1);
const loadStatus = ref('loadmore');
const isRefreshing = ref(false);

const handleTabChange = (item: any) => {
    currentTab.value = item.index;
    page.value = 1;
    list.value = [];
    loadStatus.value = 'loading';
    loadData();
};

const loadData = () => {
    const status = tabs[currentTab.value].value;
    request({
        url: '/feedback/admin/list',
        method: 'GET',
        data: {
            page: page.value,
            size: 10,
            status: status
        }
    }).then((res: any) => {
        if (isRefreshing.value) {
            list.value = [];
            isRefreshing.value = false;
            uni.stopPullDownRefresh();
        }

        if (res.code === 200) {
            const curList = res.data.records || [];
            list.value = [...list.value, ...curList];

            if (curList.length < 10) {
                loadStatus.value = 'nomore';
            } else {
                loadStatus.value = 'loadmore';
            }
        } else {
            loadStatus.value = 'nomore';
        }
    });
};

const goDetail = (item: any) => {
    uni.navigateTo({
        url: `/pages/admin/feedback_detail?id=${item.id}`
    });
};

onShow(() => {
    page.value = 1;
    list.value = [];
    loadData();
});

onPullDownRefresh(() => {
    page.value = 1;
    isRefreshing.value = true;
    loadData();
});

onReachBottom(() => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadData();
    }
});
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
}

.list-wrap {
    padding: 20rpx;
}

.item {
    background: #fff;
    padding: 30rpx;
    border-radius: 12rpx;
    margin-bottom: 20rpx;

    .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20rpx;
        font-size: 24rpx;

        .time {
            color: #999;
        }

        .status {
            color: #ff4757;

            &.replied {
                color: #5ac725;
            }
        }
    }

    .content {
        font-size: 30rpx;
        color: #333;
        margin-bottom: 20rpx;
        line-height: 1.5;
    }

    .footer {
        font-size: 24rpx;
        color: #666;
        border-top: 1rpx solid #f5f5f5;
        padding-top: 20rpx;
    }
}
</style>
