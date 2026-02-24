<template>
    <view class="container">

        <view class="content">
            <!-- 公告列表 -->
            <view class="list-section">
                <view class="section-title">已发布公告</view>
                <view v-if="announcements.length > 0" class="announcement-list">
                    <view v-for="(item, index) in announcements" :key="index" class="announcement-item">
                        <view class="item-header">
                            <text class="item-title">{{ item.title }}</text>
                            <view class="item-actions">
                                <up-button size="mini" type="primary" text="编辑" @click="editAnnouncement(item)"
                                    style="margin-right: 10rpx;"></up-button>
                                <up-button size="mini" type="error" text="删除"
                                    @click="deleteAnnouncement(item.id)"></up-button>
                            </view>
                        </view>
                        <view class="item-time">发布于：{{ item.createTime }}</view>
                    </view>
                </view>
                <view v-else class="empty">暂无公告</view>
            </view>

            <!-- 新建/编辑公告 -->
            <view class="card">
                <view class="title">{{ editMode ? '编辑公告' : '新建公告' }}</view>

                <view class="form-item">
                    <view class="label">公告标题</view>
                    <up-input v-model="form.title" placeholder="请输入公告标题"></up-input>
                </view>

                <view class="form-item">
                    <view class="label">公告内容</view>
                    <view class="editor-wrapper">
                        <lsj-edit ref="lsjEdit" placeholder="请输入公告内容..." :html="form.content" @onReady="editReady">
                            <template v-slot:btns="data">
                                <edit-btns :edit="data.edit" selectedColor="#ff4757"></edit-btns>
                            </template>
                        </lsj-edit>
                    </view>
                </view>

                <view class="button-group">
                    <up-button v-if="editMode" type="warning" text="取消编辑" @click="cancelEdit"
                        style="margin-right: 20rpx;"></up-button>
                    <up-button type="primary" :text="editMode ? '保存修改' : '立即发布'" @click="handleSubmit"
                        customStyle="background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); border: none; font-weight: bold;"></up-button>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { request } from '@/utils/request';
import config from '@/utils/config';
import editBtns from '@/uni_modules/lsj-edit/components/lsj-edit/edit-btns/edit-btns.vue';
import LsjEdit from '@/uni_modules/lsj-edit/components/lsj-edit/lsj-edit.vue';

const announcements = ref<any[]>([]);
const editMode = ref(false);
const lsjEdit = ref();
const editInstance = ref<any>(null);

const form = reactive<any>({
    id: null,
    title: '',
    content: '',
    price: 0, // 公告的价格为0
    isShelved: 1,
    isPublic: 1
});

const loadAnnouncements = () => {
    request({
        url: '/announcement/list'
    }).then((res: any) => {
        announcements.value = res.data || [];
    });
};

const editAnnouncement = (item: any) => {
    editMode.value = true;
    form.id = item.id;
    form.title = item.title;
    form.content = item.content;
    form.price = 0;
    form.isShelved = item.isShelved;
    form.isPublic = item.isPublic;

    // 滚动到编辑区域
    uni.pageScrollTo({
        scrollTop: 999999,
        duration: 300
    });
    // Set content to editor
    if (editInstance.value) {
        editInstance.value.ready(item.content);
    }
};

const cancelEdit = () => {
    editMode.value = false;
    resetForm();
};

const resetForm = () => {
    form.id = null;
    form.title = '';
    form.content = '';
    form.price = 0;
    form.isShelved = 1;
    form.isPublic = 1;
};

const deleteAnnouncement = (id: number) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这条公告吗？',
        confirmColor: '#ff4757',
        success: (res) => {
            if (res.confirm) {
                // 调用删除接口（可以调用 shelf 接口将 isShelved 设为 0）
                request({
                    url: `/announcement/${id}`,
                    method: 'DELETE'
                }).then(() => {
                    uni.showToast({ title: '删除成功' });
                    loadAnnouncements();
                });
            }
        }
    });
};

const uploadFilePromise = (url: string) => {
    return new Promise((resolve, reject) => {
        if (url.indexOf('http') === 0) {
            return resolve(url);
        }
        uni.uploadFile({
            url: config.baseUrl + '/upload/image',
            filePath: url,
            name: 'file',
            success: (res) => {
                const data = JSON.parse(res.data);
                resolve(data.data);
            },
            fail: reject
        });
    });
};

const editReady = (edit: any) => {
    editInstance.value = edit;
};

const handleSubmit = async () => {
    if (!form.title) {
        uni.showToast({ title: '请输入公告标题', icon: 'none' });
        return;
    }

    if (!editInstance.value) {
        return uni.showToast({ title: '编辑器未就绪', icon: 'none' });
    }

    uni.showLoading({ title: '正在处理...', mask: true });

    try {
        // Process images in rich text
        const res = await editInstance.value.replaceImage(async (img: string) => {
            return await uploadFilePromise(img);
        });

        const finalContent = res.html;
        if (!finalContent || finalContent === '<p><br></p>') {
            uni.hideLoading();
            return uni.showToast({ title: '请输入公告内容', icon: 'none' });
        }

        form.content = finalContent;

        const url = editMode.value ? '/announcement/update' : '/announcement/create';

        request({
            url,
            method: editMode.value ? 'PUT' : 'POST',
            data: {
                id: form.id,
                title: form.title,
                content: form.content
            }
        }).then(() => {
            uni.hideLoading();
            uni.showToast({ title: editMode.value ? '保存成功' : '发布成功' });
            resetForm();
            editMode.value = false;
            loadAnnouncements();
            // Clear editor content
            editInstance.value.reset();
        });
    } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '操作失败', icon: 'none' });
        console.error(e);
    }
};

onMounted(() => {
    loadAnnouncements();
});
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background: #f5f5f5;
}

.content {
    padding: 30rpx;
}

.list-section {
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;

    .section-title {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 20rpx;
        border-left: 8rpx solid #ff4757;
        padding-left: 20rpx;
    }

    .announcement-list {
        .announcement-item {
            padding: 24rpx;
            background: #f7f8fa;
            border-radius: 12rpx;
            margin-bottom: 20rpx;

            &:last-child {
                margin-bottom: 0;
            }

            .item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12rpx;

                .item-title {
                    flex: 1;
                    font-size: 28rpx;
                    font-weight: bold;
                    color: #333;
                    margin-right: 20rpx;
                }

                .item-actions {
                    display: flex;
                    flex-shrink: 0;
                }
            }

            .item-time {
                font-size: 24rpx;
                color: #999;
            }
        }
    }

    .empty {
        text-align: center;
        color: #999;
        padding: 40rpx 0;
    }
}

.card {
    background: #fff;
    padding: 30rpx;
    border-radius: 20rpx;

    .title {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 30rpx;
        border-left: 8rpx solid #ff4757;
        padding-left: 20rpx;
    }

    .form-item {
        margin-bottom: 30rpx;

        .label {
            font-size: 28rpx;
            color: #666;
            margin-bottom: 15rpx;
        }

        .editor-wrapper {
            border: 1rpx solid #eee;
            border-radius: 12rpx;
            overflow: hidden;
            min-height: 400rpx;
            background: #fff;
        }
    }



    .button-group {
        display: flex;
        justify-content: flex-end;
    }
}
</style>
