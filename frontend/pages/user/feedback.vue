<template>
    <view class="container">
        <up-tabs :list="tabs" :current="currentTab" @click="handleTabChange" lineColor="#ff4757"
            activeColor="#ff4757"></up-tabs>

        <view class="main-body" v-if="currentTab === 0">
            <view class="form-box">
                <view class="section-title">问题描述</view>
                <up-textarea v-model="content" placeholder="请详细描述您遇到的问题或改进建议..." count maxlength="200" height="240"
                    customStyle="background-color: #f8f9fb; border-radius: 20rpx; border: none; padding: 24rpx;"></up-textarea>

                <view class="section-title" style="margin-top: 48rpx;">图片上传 (可选)</view>
                <view class="upload-wrap">
                    <up-upload :fileList="fileList" @afterRead="afterRead" @delete="deletePic" multiple :maxCount="3"
                        width="160" height="160"></up-upload>
                </view>

                <view class="contact-box">
                    <view class="section-title">联系方式</view>
                    <up-input v-model="contact" placeholder="手机号/微信号/邮箱"
                        customStyle="background-color: #f8f9fb; border-radius: 20rpx; border: none; padding: 0 24rpx; height: 100rpx;"></up-input>
                </view>

                <view class="submit-btn-box">
                    <up-button :loading="loading" text="提交反馈"
                        customStyle="height: 100rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; font-size: 32rpx; font-weight: bold; border-radius: 50rpx; border: none; margin-top: 60rpx;"
                        @click="handleSubmit"></up-button>
                </view>
            </view>
        </view>

        <view class="history-list" v-else>
            <view class="item" v-for="(item, index) in historyList" :key="index">
                <view class="header">
                    <text class="time">{{ formatDate(item.createTime) }}</text>
                    <text class="status" :class="{ 'replied': item.status === 1 }">
                        {{ item.status === 1 ? '已回复' : '处理中' }}
                    </text>
                </view>
                <view class="content">{{ item.content }}</view>
                <view class="reply-box" v-if="item.status === 1">
                    <text class="label">官方回复：</text>
                    <text class="reply-text">{{ item.reply }}</text>
                    <view class="reply-time">{{ formatDate(item.replyTime) }}</view>
                </view>
            </view>
            <!-- 加载状态提示 -->
            <view class="load-status" v-if="historyList.length > 0">
                <view v-if="historyLoading" class="load-tip">
                    <up-loading-icon size="20" color="#999"></up-loading-icon>
                    <text class="load-text">加载中...</text>
                </view>
                <view v-else-if="historyFinished" class="load-tip">
                    <text class="load-text">— 已加载全部记录 —</text>
                </view>
            </view>
            <view class="empty-box" v-if="!historyLoading && historyList.length === 0">
                <up-empty mode="message" text="暂无反馈记录"></up-empty>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onReachBottom } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import config from '@/utils/config';
import { submitFeedback } from '@/api/feedback';
import dayjs from 'dayjs';

const tabs = [{ name: '提交反馈' }, { name: '我的反馈' }];
const currentTab = ref(0);
const content = ref('');
const contact = ref('');
const fileList = ref<any[]>([]);
const loading = ref(false);
const uploadedImages = ref<string[]>([]);
const historyList = ref<any[]>([]);

// 反馈历史分页状态
const historyPage = ref(1);
const historyPageSize = ref(10);
const historyLoading = ref(false);
const historyFinished = ref(false);

const formatDate = (timeStr: string) => {
    if (!timeStr) return '';
    return dayjs(timeStr).format('YYYY-MM-DD HH:mm');
};

const handleTabChange = (item: any) => {
    currentTab.value = item.index;
    if (item.index === 1) {
        loadHistory(false);
    }
};

const loadHistory = (isLoadMore = false) => {
    if (historyLoading.value) return;
    if (isLoadMore && historyFinished.value) return;

    historyLoading.value = true;

    if (!isLoadMore) {
        historyPage.value = 1;
        historyFinished.value = false;
    }

    request({
        url: '/feedback/list',
        method: 'GET',
        data: {
            page: historyPage.value,
            size: historyPageSize.value
        }
    }).then((res: any) => {
        if (res.code === 200) {
            const records = res.data.records || [];
            const total = res.data.total || 0;

            if (isLoadMore) {
                historyList.value = [...historyList.value, ...records];
            } else {
                historyList.value = records;
            }

            if (historyList.value.length >= total || records.length < historyPageSize.value) {
                historyFinished.value = true;
            }
        }
    }).finally(() => {
        historyLoading.value = false;
    });
};

// 触底加载更多（仅在"我的反馈" tab 生效）
onReachBottom(() => {
    if (currentTab.value === 1 && !historyFinished.value && !historyLoading.value) {
        historyPage.value++;
        loadHistory(true);
    }
});

const afterRead = (event: any) => {
    const files = Array.isArray(event.file) ? event.file : [event.file];
    files.forEach((file: any) => {
        const index = fileList.value.push({
            ...file,
            status: 'uploading',
            message: '上传中...'
        }) - 1;

        uni.uploadFile({
            url: config.baseUrl + '/upload/image',
            filePath: file.url,
            name: 'file',
            success: (uploadFileRes) => {
                const data = JSON.parse(uploadFileRes.data);
                if (data.code === 200) {
                    uploadedImages.value.push(data.data);
                    fileList.value[index].status = 'success';
                    fileList.value[index].message = '';
                    fileList.value[index].url = data.data;
                } else {
                    fileList.value[index].status = 'failed';
                    fileList.value[index].message = '上传失败';
                }
            },
            fail: () => {
                fileList.value[index].status = 'failed';
                fileList.value[index].message = '上传失败';
            }
        });
    });
};

const deletePic = (event: any) => {
    fileList.value.splice(event.index, 1);
    uploadedImages.value.splice(event.index, 1);
};

const handleSubmit = () => {
    if (!content.value) {
        uni.showToast({ title: '请输入反馈内容', icon: 'none' });
        return;
    }

    loading.value = true;
    submitFeedback({
        userId: uni.getStorageSync('userInfo').id,
        type: '意见反馈',
        contact: contact.value,
        content: content.value,
        images: uploadedImages.value.length > 0 ? JSON.stringify(uploadedImages.value) : ''
    }).then((res: any) => {
        if (res.code === 200) {
            uni.showToast({ title: '提交成功' });
            content.value = '';
            contact.value = '';
            fileList.value = [];
            uploadedImages.value = [];
            setTimeout(() => {
                currentTab.value = 1;
                loadHistory(false);
            }, 1000);
        } else {
            uni.showToast({ title: res.msg || '提交失败', icon: 'none' });
        }
    }).finally(() => {
        loading.value = false;
    });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f8f8f8;
}

.main-body,
.history-list {
    padding: 30rpx;
}

.form-box,
.item {
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
}

.item {
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
            color: #ff8c42;

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

    .reply-box {
        background: #f8f9fb;
        padding: 20rpx;
        border-radius: 8rpx;

        .label {
            font-size: 26rpx;
            color: #ff4757;
            font-weight: bold;
            display: block;
            margin-bottom: 8rpx;
        }

        .reply-text {
            font-size: 28rpx;
            color: #666;
            line-height: 1.5;
        }

        .reply-time {
            font-size: 22rpx;
            color: #bfc5d6;
            margin-top: 10rpx;
            text-align: right;
        }
    }
}

.section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;

    &::before {
        content: '';
        display: inline-block;
        width: 6rpx;
        height: 24rpx;
        background: #ff4757;
        margin-right: 12rpx;
        vertical-align: middle;
        border-radius: 3rpx;
    }
}

.contact-box {
    margin-top: 40rpx;
    margin-bottom: 60rpx;
}

.submit-btn-box {
    margin-top: 40rpx;
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

.empty-box {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
}
</style>
