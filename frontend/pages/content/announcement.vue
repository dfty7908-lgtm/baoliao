<template>
    <view class="container">
        <view class="main-content" v-if="detail">
            <view class="card announcement-card">
                <view class="header">
                    <up-icon name="volume-fill" color="#ff4757" size="24"></up-icon>
                    <text class="title">{{ detail.title }}</text>
                </view>
                <view class="time">发布时间：{{ formatDate(detail.createTime) }}</view>
                <view class="divider"></view>
                <view class="rich-content">
                    <rich-text :nodes="detail.content"></rich-text>
                </view>
            </view>
        </view>
        <view v-else-if="loading" class="loading-state">
            <up-loading-icon color="#ff4757"></up-loading-icon>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const detail = ref<any>(null);
const loading = ref(true);

const formatDate = (timeStr: string) => {
    if (!timeStr) return '';
    try {
        return timeStr.replace('T', ' ').substring(0, 16);
    } catch (e) {
        return timeStr;
    }
};

const loadDetail = (id: string) => {
    request({
        url: `/announcement/${id}`
    }).then((res: any) => {
        if (res.code === 200) {
            detail.value = res.data;
        } else {
            uni.showToast({ title: res.msg || '获取详情失败', icon: 'none' });
        }
    }).finally(() => {
        loading.value = false;
    });
};

onLoad((options: any) => {
    if (options.id) {
        loadDetail(options.id);
    }
});
</script>

<style lang="scss" scoped>
.container {
    padding: 30rpx;
    background-color: #f7f8fa;
    min-height: 100vh;
}

.announcement-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 40rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);

    .header {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;

        .title {
            margin-left: 16rpx;
            font-size: 34rpx;
            font-weight: bold;
            color: #333;
        }
    }

    .time {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 30rpx;
    }

    .divider {
        height: 1rpx;
        background-color: #eee;
        margin-bottom: 30rpx;
    }

    .rich-content {
        font-size: 30rpx;
        color: #444;
        line-height: 1.8;
        word-break: break-all;

        :deep(img) {
            max-width: 100% !important;
            height: auto !important;
        }

        :deep(p) {
            word-break: break-all;
        }
    }
}

.loading-state {
    display: flex;
    justify-content: center;
    padding-top: 200rpx;
}
</style>
