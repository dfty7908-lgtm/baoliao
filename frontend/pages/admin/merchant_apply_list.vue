<template>
    <view class="container">
        <view class="list">
            <view v-for="(item, index) in list" :key="index" class="apply-card">
                <view class="card-header">
                    <view class="user-info">
                        <text class="name">{{ item.name }}</text>
                        <text class="phone">{{ item.phone }}</text>
                    </view>
                    <view class="status-tag" :class="getStatusClass(item.status)">
                        {{ getStatusText(item.status) }}
                    </view>
                </view>
                <view class="card-body">
                    <view class="info-row">
                        <text class="label">微信：</text>
                        <text class="value">{{ item.wechatId }}</text>
                    </view>
                    <view class="info-row">
                        <text class="label">粉丝数：</text>
                        <text class="value">{{ item.fansCount }}</text>
                    </view>
                    <view class="info-row" v-if="item.officialAccount">
                        <text class="label">公众号：</text>
                        <text class="value">{{ item.officialAccount }}</text>
                    </view>
                    <view class="info-row">
                        <text class="label">说明：</text>
                        <text class="value desc">{{ item.description || '无' }}</text>
                    </view>
                    <view class="info-row" v-if="item.remark">
                        <text class="label">备注：</text>
                        <text class="value remark">{{ item.remark }}</text>
                    </view>
                </view>
                <view class="card-footer">
                    <up-button size="mini" type="info" text="编辑" @click="openEdit(item)"
                        customStyle="margin-right: 20rpx; width: 120rpx; height: 60rpx; border-radius: 30rpx; background: #fff; color: #ff4757; border: 1rpx solid #ff4757;"></up-button>
                    <template v-if="item.status === 0">
                        <up-button size="mini" type="info" text="驳回" @click="openAudit(item, 2)"
                            customStyle="margin-right: 20rpx; width: 120rpx; height: 60rpx; border-radius: 30rpx; background: #f5f5f5; color: #666; border: none;"></up-button>
                        <up-button size="mini" type="primary" text="通过" @click="openAudit(item, 1)"
                            customStyle="width: 120rpx; height: 60rpx; border-radius: 30rpx; background: #ff4757; color: #fff; border: none;"></up-button>
                    </template>
                </view>
            </view>
            <view v-if="list.length === 0" class="empty">暂无申请记录</view>
            <up-loadmore :status="loadStatus" @loadmore="loadMore"></up-loadmore>
        </view>

        <up-modal :show="auditModal.show" :title="auditModal.status === 1 ? '通过审核' : '驳回申请'" showCancelButton
            confirmColor="#ff4757" @confirm="handleAudit" @cancel="auditModal.show = false">
            <view class="modal-content" style="padding: 0 40rpx;">
                <up-textarea v-model="auditModal.remark" placeholder="请输入审核备注..." count maxlength="100" height="160rpx"
                    customStyle="width: 520rpx; background: #f8f8f8; border-radius: 12rpx; padding: 20rpx;"
                    countStyle="background: transparent;"></up-textarea>
            </view>
        </up-modal>

        <!-- Edit Modal -->
        <up-modal :show="editModal.show" title="编辑申请信息" showCancelButton confirmColor="#ff4757" @confirm="handleUpdate"
            @cancel="editModal.show = false">
            <view class="edit-modal-content">
                <view class="edit-item">
                    <text class="label">姓名</text>
                    <up-input v-model="editModal.form.name" border="bottom" activeColor="#ff4757"></up-input>
                </view>
                <view class="edit-item">
                    <text class="label">手机号</text>
                    <up-input v-model="editModal.form.phone" border="bottom" activeColor="#ff4757"></up-input>
                </view>
                <view class="edit-item">
                    <text class="label">微信号</text>
                    <up-input v-model="editModal.form.wechatId" border="bottom" activeColor="#ff4757"></up-input>
                </view>
                <view class="edit-item">
                    <text class="label">粉丝数</text>
                    <up-input v-model="editModal.form.fansCount" border="bottom" activeColor="#ff4757"></up-input>
                </view>
                <view class="edit-item">
                    <text class="label">公众号</text>
                    <up-input v-model="editModal.form.officialAccount" border="bottom" activeColor="#ff4757"></up-input>
                </view>
                <view class="edit-item no-border">
                    <text class="label">申请说明</text>
                    <up-textarea v-model="editModal.form.description" count maxlength="100" height="120rpx"
                        customStyle="background: #f8f8f8; padding: 10rpx; margin-top: 10rpx;"></up-textarea>
                </view>
            </view>
        </up-modal>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onReachBottom } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const list = ref<any[]>([]);
const page = ref(1);
const loadStatus = ref('loadmore');

const auditModal = ref({
    show: false,
    item: null as any,
    status: 0,
    remark: ''
});

const editModal = ref({
    show: false,
    form: {
        id: null as number | null,
        name: '',
        phone: '',
        wechatId: '',
        fansCount: '',
        officialAccount: '',
        description: ''
    }
});

const openEdit = (item: any) => {
    editModal.value.form = { ...item };
    editModal.value.show = true;
};

const handleUpdate = () => {
    request({
        url: '/merchant/apply/admin/update',
        method: 'POST',
        data: editModal.value.form
    }).then((res: any) => {
        if (res.code === 200) {
            uni.showToast({ title: '修改成功' });
            editModal.value.show = false;
            resetList();
        }
    });
};

onShow(() => {
    resetList();
});

onReachBottom(() => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadList();
    }
});

const resetList = () => {
    page.value = 1;
    list.value = [];
    loadList();
};

const loadList = () => {
    loadStatus.value = 'loading';
    request({
        url: '/merchant/apply/admin/list',
        data: { page: page.value, size: 10 }
    }).then((res: any) => {
        const records = res.data.records || [];
        list.value = [...list.value, ...records];
        loadStatus.value = records.length < 10 ? 'nomore' : 'loadmore';
    });
};

const loadMore = () => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadList();
    }
};

const getStatusText = (status: number) => {
    if (status === 0) return '待审核';
    if (status === 1) return '已通过';
    if (status === 2) return '已驳回';
    return '';
};

const getStatusClass = (status: number) => {
    if (status === 0) return 'pending';
    if (status === 1) return 'success';
    if (status === 2) return 'error';
    return '';
};

const openAudit = (item: any, status: number) => {
    auditModal.value.item = item;
    auditModal.value.status = status;
    auditModal.value.remark = '';
    auditModal.value.show = true;
};

const handleAudit = () => {
    request({
        url: '/merchant/apply/admin/audit',
        method: 'POST',
        data: {
            id: auditModal.value.item.id,
            status: auditModal.value.status,
            remark: auditModal.value.remark
        }
    }).then(() => {
        uni.showToast({ title: '操作成功' });
        auditModal.value.show = false;
        resetList();
    });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
    padding: 20rpx;
}

.apply-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24rpx;
        padding-bottom: 20rpx;
        border-bottom: 1rpx solid #f5f5f5;

        .user-info {
            display: flex;
            flex-direction: column;

            .name {
                font-size: 32rpx;
                font-weight: bold;
                color: #333;
            }

            .phone {
                font-size: 24rpx;
                color: #999;
                margin-top: 4rpx;
            }
        }

        .status-tag {
            font-size: 24rpx;
            padding: 4rpx 16rpx;
            border-radius: 8rpx;

            &.pending {
                background: #fff7e6;
                color: #ffa940;
            }

            &.success {
                background: #fff1f0;
                color: #ff4757;
            }

            &.error {
                background: #f5f5f5;
                color: #999;
            }
        }
    }

    .card-body {
        .info-row {
            display: flex;
            margin-bottom: 12rpx;
            font-size: 28rpx;

            .label {
                color: #999;
                min-width: 100rpx;
            }

            .value {
                color: #666;
                flex: 1;
            }

            .value.desc {
                color: #333;
            }

            .value.remark {
                color: #ff4757;
                font-size: 26rpx;
            }
        }
    }

    .card-footer {
        margin-top: 24rpx;
        padding-top: 24rpx;
        border-top: 1rpx solid #f5f5f5;
        display: flex;
        justify-content: flex-end;
    }
}

.empty {
    text-align: center;
    color: #999;
    padding: 100rpx 0;
    font-size: 28rpx;
}

.modal-content {
    padding: 30rpx 40rpx;
}

.edit-modal-content {
    width: 100%;
    padding: 20rpx 40rpx;

    .edit-item {
        margin-bottom: 30rpx;

        .label {
            font-size: 26rpx;
            color: #999;
            margin-bottom: 10rpx;
            display: block;
        }

        &.no-border {
            margin-bottom: 0;
        }
    }
}
</style>
