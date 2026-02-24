<template>
    <view class="container">
        <view class="chat-list">
            <view class="chat-item" v-for="(item, index) in list" :key="index" @click="handleChat(item)">
                <view class="avatar-box">
                    <up-avatar :src="item.avatar || '/static/logo.png'" size="48" shape="square"></up-avatar>
                    <up-badge :value="item.unreadCount" max="99" absolute :offset="[-6, -6]"
                        v-if="item.unreadCount > 0"></up-badge>
                </view>
                <view class="content-box">
                    <view class="row-top">
                        <text class="nickname">{{ item.nickname || '用户' + item.userId }}</text>
                        <text class="time">{{ formatTime(item.updateTime) }}</text>
                    </view>
                    <view class="row-bottom">
                        <text class="last-msg u-line-1">{{ item.msgType === 1 ? '[图片]' : (item.lastMsg || '暂无消息')
                            }}</text>
                    </view>
                </view>
            </view>
        </view>

        <view v-if="list.length === 0" class="empty-state">
            <up-empty mode="message" text="暂无消息记录"></up-empty>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

const list = ref<any[]>([]);

const loadData = () => {
    request({
        url: '/chat/conversations',
        method: 'GET'
    }).then((res: any) => {
        if (res.code === 200) {
            list.value = res.data || [];
        }
        uni.stopPullDownRefresh();
    });
};

const formatTime = (time: string) => {
    if (!time) return '';
    const date = dayjs(time);
    const now = dayjs();
    if (date.isSame(now, 'day')) {
        return date.format('HH:mm');
    } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
        return '昨天';
    } else {
        return date.format('MM-DD');
    }
};

const handleChat = (item: any) => {
    uni.navigateTo({
        url: `/pages/admin/chat_detail?userId=${item.userId}&nickname=${item.nickname || ''}`
    });
};

onShow(() => {
    loadData();
});

onPullDownRefresh(() => {
    loadData();
});
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
}

.chat-list {
    background-color: #fff;
}

.chat-item {
    display: flex;
    padding: 24rpx 30rpx;
    align-items: center;
    border-bottom: 1rpx solid #f5f5f5;
    background: #fff;

    &:active {
        background-color: #fafafa;
    }

    .avatar-box {
        position: relative;
        margin-right: 24rpx;
    }

    .content-box {
        flex: 1;
        overflow: hidden;

        .row-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8rpx;

            .nickname {
                font-size: 32rpx;
                color: #333;
                font-weight: 500;
            }

            .time {
                font-size: 24rpx;
                color: #999;
            }
        }

        .row-bottom {
            .last-msg {
                font-size: 26rpx;
                color: #999;
                width: 100%;
                display: block;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }
    }
}

.empty-state {
    padding-top: 200rpx;
}
</style>
