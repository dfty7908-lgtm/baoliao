<template>
    <view class="container">
        <view class="list-wrap">
            <view v-if="list.length > 0">
                <view v-for="(item, index) in list" :key="index" class="announcement-card" @click="goDetail(item.id)">
                    <view class="card-header">
                        <view class="title-row">
                            <up-icon name="volume-fill" size="20" color="#ff4757"></up-icon>
                            <text class="title">{{ item.title }}</text>
                        </view>
                        <text class="time">{{ formatDate(item.createTime) }}</text>
                    </view>
                    <view class="card-desc u-line-2">
                        {{ stripHtml(item.content) }}
                    </view>
                    <view class="card-footer">
                        <text class="more-btn">查看详情</text>
                        <up-icon name="arrow-right" size="14" color="#ff4757"></up-icon>
                    </view>
                </view>
            </view>
            <view v-else class="empty-state">
                <up-icon name="empty-data" size="60" color="#eee"></up-icon>
                <text class="empty-text">暂无公告</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const list = ref<any[]>([]);

const formatDate = (time: any) => {
    if (!time) return '';
    return dayjs(time).format('YYYY-MM-DD HH:mm');
};

const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
};

const loadData = () => {
    uni.showLoading({ title: '加载中...' });
    request({
        url: '/announcement/list'
    }).then((res: any) => {
        list.value = res.data || [];
    }).finally(() => {
        uni.hideLoading();
    });
};

const goDetail = (id: number) => {
    uni.navigateTo({
        url: `/pages/content/announcement?id=${id}`
    });
};

onShow(() => {
    loadData();
});
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
    padding: 30rpx;
}

.announcement-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;

        .title-row {
            display: flex;
            align-items: center;
            flex: 1;
            margin-right: 20rpx;

            .title {
                font-size: 32rpx;
                font-weight: bold;
                color: #333;
                margin-left: 12rpx;
            }
        }

        .time {
            font-size: 24rpx;
            color: #999;
        }
    }

    .card-desc {
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
        margin-bottom: 24rpx;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    .card-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding-top: 20rpx;
        border-top: 1rpx solid #f8f8f8;

        .more-btn {
            font-size: 24rpx;
            color: #ff4757;
            margin-right: 4rpx;
        }
    }
}

.empty-state {
    padding-top: 200rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .empty-text {
        margin-top: 20rpx;
        font-size: 28rpx;
        color: #999;
    }
}
</style>
