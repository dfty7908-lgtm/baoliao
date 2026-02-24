<template>
    <view class="container">
        <view class="card">
            <view class="header">
                <text class="label">反馈时间</text>
                <text class="value">{{ formatDate(detail.createTime) }}</text>
            </view>
            <view class="header">
                <text class="label">联系方式</text>
                <text class="value">{{ detail.contact || '未填写' }}</text>
            </view>
            <view class="divider"></view>
            <view class="content-box">
                <view class="label">反馈内容</view>
                <text class="text">{{ detail.content }}</text>
            </view>
            <view class="img-box" v-if="detail.images">
                <image v-for="(img, idx) in imageList" :key="idx" :src="img" mode="aspectFill" class="img"
                    @click="previewImage(idx)"></image>
            </view>
        </view>

        <view class="card" v-if="detail.status === 1">
            <view class="header">
                <text class="label">回复内容</text>
                <text class="value time">{{ formatDate(detail.replyTime) }}</text>
            </view>
            <view class="reply-content">
                {{ detail.reply }}
            </view>
        </view>

        <view class="card input-card" v-else>
            <view class="label">回复用户</view>
            <up-textarea v-model="replyContent" placeholder="请输入回复内容..." height="200"
                customStyle="background: #f8f8f8; border: none; padding: 20rpx; margin-top: 20rpx;"></up-textarea>
            <up-button :loading="submitting" text="发送回复" type="primary"
                customStyle="margin-top: 30rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); border: none;"
                @click="handleSubmit"></up-button>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

import dayjs from 'dayjs';

const detail = ref<any>({});
const replyContent = ref('');
const submitting = ref(false);

const formatDate = (timeStr: string) => {
    if (!timeStr) return '';
    return dayjs(timeStr).format('YYYY-MM-DD HH:mm');
};

const imageList = computed(() => {
    if (!detail.value.images) return [];
    try {
        return JSON.parse(detail.value.images);
    } catch (e) {
        return detail.value.images.split(',');
    }
});

onLoad((options: any) => {
    if (options.id) {
        loadDetail(options.id);
    }
});

const loadDetail = (id: string | number) => {
    // Try to get from storage first for instant display
    const item = uni.getStorageSync('currentFeedback');
    if (item && String(item.id) === String(id)) {
        detail.value = item;
    }

    // Fetch from API
    request({
        url: `/feedback/detail/${id}`
    }).then((res: any) => {
        if (res.data) {
            detail.value = res.data;
            // Update storage
            uni.setStorageSync('currentFeedback', res.data);
        }
    });
};

const previewImage = (current: number) => {
    uni.previewImage({
        urls: imageList.value,
        current
    });
};

const handleSubmit = () => {
    if (!replyContent.value.trim()) {
        uni.showToast({ title: '请输入回复内容', icon: 'none' });
        return;
    }

    if (!detail.value.id) {
        uni.showToast({ title: '反馈信息缺失，无法回复', icon: 'none' });
        return;
    }

    submitting.value = true;
    request({
        url: '/feedback/reply',
        method: 'POST',
        data: {
            feedbackId: detail.value.id,
            reply: replyContent.value
        }
    }).then((res: any) => {
        if (res.code === 200) {
            uni.showToast({ title: '回复成功' });
            detail.value.status = 1;
            detail.value.reply = replyContent.value;
            detail.value.replyTime = new Date().toLocaleString();
            // Update storage for consistency if we go back
            const item = uni.getStorageSync('currentFeedback');
            if (item) {
                item.status = 1;
                uni.setStorageSync('currentFeedback', item);
            }
            setTimeout(() => uni.navigateBack(), 1500);
        } else {
            uni.showToast({ title: res.msg || '失败', icon: 'none' });
        }
    }).finally(() => {
        submitting.value = false;
    });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
    padding: 20rpx;
}

.card {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;

    .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20rpx;
        font-size: 28rpx;

        .label {
            color: #666;
        }

        .value {
            color: #333;
            font-weight: 500;

            &.time {
                font-size: 24rpx;
                color: #999;
            }
        }
    }

    .divider {
        height: 1rpx;
        background: #f5f5f5;
        margin: 20rpx 0;
    }

    .content-box {
        .label {
            font-size: 28rpx;
            font-weight: bold;
            margin-bottom: 15rpx;
            color: #333;
        }

        .text {
            font-size: 30rpx;
            color: #333;
            line-height: 1.6;
        }
    }

    .reply-content {
        font-size: 30rpx;
        color: #333;
        line-height: 1.6;
        background: #f8f9fb;
        padding: 20rpx;
        border-radius: 8rpx;
    }

    .img-box {
        display: flex;
        flex-wrap: wrap;
        gap: 10rpx;
        margin-top: 20rpx;

        .img {
            width: 200rpx;
            height: 200rpx;
            border-radius: 8rpx;
        }
    }
}
</style>
