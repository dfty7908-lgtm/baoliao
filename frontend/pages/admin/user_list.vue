<template>
    <view class="container">
        <view class="search-wrap">
            <up-search v-model="keyword" placeholder="搜搜索手机号/昵称..." :showAction="false" @search="loadList"
                @clear="loadList"></up-search>
        </view>

        <view class="user-list">
            <view class="user-item" v-for="user in list" :key="user.id">
                <view class="avatar-info">
                    <image :src="user.avatar || '/static/logo.png'" mode="aspectFill" class="avatar"></image>
                    <view class="info">
                        <text class="nickname">{{ user.nickname }} (ID: {{ user.id }})</text>
                        <text class="phone">{{ user.phone || '未绑定' }}</text>
                    </view>
                    <view class="balance">
                        <text class="val">¥{{ user.balance }}</text>
                        <text class="lab">余额</text>
                    </view>
                </view>
                <view class="bottom">
                    <text class="time">注册时间: {{ user.createTime.replace('T', ' ') }}</text>
                    <view class="actions">
                        <up-tag v-if="user.role === 1" text="管理员" type="error" size="mini" plain
                            customStyle="margin-right: 20rpx;"></up-tag>
                        <text class="block-btn" :class="{ unblock: user.status === 0 }" @click="toggleStatus(user)">
                            {{ user.status === 1 ? '禁用用户' : '解除禁用' }}
                        </text>
                    </view>
                </view>
            </view>
            <up-loadmore :status="loadStatus" @loadmore="loadList"></up-loadmore>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const list = ref<any[]>([]);
const keyword = ref('');
const page = ref(1);
const loadStatus = ref('loadmore');

onLoad(() => {
    loadList();
});

onReachBottom(() => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadList();
    }
});

const loadList = () => {
    loadStatus.value = 'loading';
    request({
        url: '/user/admin/list',
        data: { page: page.value, size: 20, keyword: keyword.value }
    }).then((res: any) => {
        const records = res.data.records || [];
        if (page.value === 1) list.value = records;
        else list.value = [...list.value, ...records];
        loadStatus.value = records.length < 20 ? 'nomore' : 'loadmore';
    });
};

const toggleStatus = (user: any) => {
    const newStatus = user.status === 1 ? 0 : 1;
    request({
        url: '/user/admin/status',
        method: 'POST',
        params: { userId: user.id, status: newStatus }
    }).then(() => {
        user.status = newStatus;
        uni.showToast({ title: '操作成功' });
    });
};
</script>

<style lang="scss" scoped>
.container {
    background: #f8f9fa;
    min-height: 100vh;
    padding: 24rpx;
}

.search-wrap {
    margin-bottom: 24rpx;
}

.user-item {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;

    .avatar-info {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;

        .avatar {
            width: 88rpx;
            height: 88rpx;
            border-radius: 44rpx;
            margin-right: 20rpx;
            background: #f0f0f0;
        }

        .info {
            flex: 1;
            display: flex;
            flex-direction: column;

            .nickname {
                font-size: 30rpx;
                font-weight: bold;
                color: #333;
            }

            .phone {
                font-size: 24rpx;
                color: #999;
                margin-top: 4rpx;
            }
        }

        .balance {
            text-align: right;

            .val {
                display: block;
                font-size: 32rpx;
                font-weight: 800;
                color: #ff4757;
            }

            .lab {
                font-size: 22rpx;
                color: #ccc;
            }
        }
    }

    .bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16rpx;
        border-top: 1rpx solid #f8f8f8;

        .time {
            font-size: 22rpx;
            color: #bbb;
        }

        .actions {
            display: flex;
            align-items: center;

            .block-btn {
                font-size: 24rpx;
                color: #ff4757;

                &.unblock {
                    color: #52c41a;
                }
            }
        }
    }
}
</style>
