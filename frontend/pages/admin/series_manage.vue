<template>
    <view class="container">
        <view class="header-bar">
            <text class="page-title">系列管理</text>
            <up-button text="+ 新建系列" size="small" @click="openForm(null)"
                customStyle="background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); border: none; color: #fff; border-radius: 40rpx; padding: 0 30rpx;"></up-button>
        </view>

        <!-- Series List -->
        <view class="series-list">
            <view class="series-card" v-for="item in seriesList" :key="item.id">
                <view class="card-header">
                    <text class="series-name">{{ item.name }}</text>
                    <view class="period-badge">
                        <text>当前第 {{ item.currentPeriod || 0 }} 期</text>
                    </view>
                </view>
                <view class="card-body">
                    <view class="info-row">
                        <text class="info-label">标题模板：</text>
                        <text class="info-value">{{ item.titleTemplate }}</text>
                    </view>
                    <view class="info-row" v-if="item.suffix">
                        <text class="info-label">后缀：</text>
                        <text class="info-value">{{ item.suffix }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label">默认价格：</text>
                        <text class="info-value price">¥{{ item.defaultPrice || '0.00' }}</text>
                    </view>
                    <view class="preview-row">
                        <text class="info-label">预览：</text>
                        <text class="preview-text">{{ generatePreview(item) }}</text>
                    </view>
                </view>
                <view class="card-actions">
                    <text class="btn-text green" @click="quickPublish(item)">发布下一期</text>
                    <text class="btn-text blue" @click="openForm(item)">编辑</text>
                    <text class="btn-text red" @click="confirmDelete(item.id)">删除</text>
                </view>
            </view>

            <view class="empty-tip" v-if="seriesList.length === 0">
                <text>暂无系列，点击右上角新建</text>
            </view>
        </view>

        <!-- Create/Edit Modal -->
        <up-popup :show="showForm" mode="bottom" :round="20" @close="showForm = false">
            <view class="form-popup">
                <view class="popup-header">
                    <text class="popup-title">{{ editingId ? '编辑系列' : '新建系列' }}</text>
                    <text class="popup-close" @click="showForm = false">✕</text>
                </view>

                <scroll-view scroll-y style="max-height: 60vh;">
                    <view class="form-content">
                        <view class="form-item">
                            <text class="label">系列名称</text>
                            <up-input v-model="formData.name" placeholder="如：(财运大师)单挑一组三中三" border="bottom"></up-input>
                        </view>

                        <view class="form-item">
                            <text class="label">标题模板 <text class="hint">（用 {期号} 作为占位符）</text></text>
                            <up-input v-model="formData.titleTemplate" placeholder="如：港澳{期号}期 (财运大师)单挑一组三中三"
                                border="bottom"></up-input>
                        </view>

                        <view class="form-item">
                            <text class="label">标题后缀（可选）</text>
                            <up-input v-model="formData.suffix" placeholder="如：✅💯超级稳定" border="bottom"></up-input>
                        </view>

                        <view class="form-item">
                            <text class="label">默认价格</text>
                            <up-input v-model="formData.defaultPrice" type="digit" placeholder="0.00" border="bottom">
                                <template #prefix>
                                    <text style="margin-right: 10rpx; color: #333;">¥</text>
                                </template>
                            </up-input>
                        </view>

                        <view class="form-item">
                            <text class="label">默认标签（回车添加）</text>
                            <view class="tags-row">
                                <up-tag v-for="(tag, index) in formTags" :key="index" :text="tag" closable type="error"
                                    @close="formTags.splice(index, 1)"
                                    customStyle="margin-right: 12rpx; margin-bottom: 12rpx;"></up-tag>
                            </view>
                            <up-input v-model="tagInput" placeholder="添加标签" @confirm="addFormTag"
                                border="bottom"></up-input>
                        </view>

                        <view class="form-item">
                            <text class="label">起始期号</text>
                            <up-input v-model="formData.currentPeriod" type="number" placeholder="0（下一期将为001）"
                                border="bottom"></up-input>
                        </view>

                        <view class="form-item">
                            <text class="label">随机码生成数量 (1-49)</text>
                            <up-input v-model="formData.randomCodeCount" type="number" placeholder="设置为 0 表示不自动生成"
                                border="bottom"></up-input>
                        </view>

                        <!-- Live Preview -->
                        <view class="form-item preview-box">
                            <text class="label">标题预览</text>
                            <view class="preview-card">
                                <text class="preview-result">{{ livePreview }}</text>
                            </view>
                        </view>
                    </view>
                </scroll-view>

                <view class="popup-footer">
                    <up-button :text="editingId ? '保存修改' : '创建系列'" @click="handleSave"
                        customStyle="height: 88rpx; border-radius: 44rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); border: none; font-size: 30rpx; font-weight: bold; color: #fff;"></up-button>
                </view>
            </view>
        </up-popup>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const seriesList = ref<any[]>([]);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const tagInput = ref('');
const formTags = ref<string[]>([]);

const formData = reactive({
    name: '',
    titleTemplate: '',
    suffix: '',
    defaultPrice: '',
    currentPeriod: '',
    randomCodeCount: ''
});

onShow(() => {
    loadList();
});

const loadList = () => {
    request({ url: '/series/list' }).then((res: any) => {
        seriesList.value = res.data || [];
    });
};

const generatePreview = (item: any) => {
    const nextPeriod = String((item.currentPeriod || 0) + 1).padStart(3, '0');
    let title = (item.titleTemplate || '').replace('{期号}', nextPeriod);
    if (item.suffix) {
        title += ' ' + item.suffix;
    }
    return title;
};

const livePreview = computed(() => {
    const period = String((parseInt(formData.currentPeriod) || 0) + 1).padStart(3, '0');
    let title = (formData.titleTemplate || '标题模板预览').replace('{期号}', period);
    if (formData.suffix) {
        title += ' ' + formData.suffix;
    }
    return title;
});

const openForm = (item: any) => {
    if (item) {
        editingId.value = item.id;
        formData.name = item.name;
        formData.titleTemplate = item.titleTemplate;
        formData.suffix = item.suffix || '';
        formData.defaultPrice = String(item.defaultPrice || '');
        formData.currentPeriod = String(item.currentPeriod || 0);
        formData.randomCodeCount = String(item.randomCodeCount || 0);
        try {
            formTags.value = JSON.parse(item.defaultTags || '[]');
        } catch (e) {
            formTags.value = [];
        }
    } else {
        editingId.value = null;
        formData.name = '';
        formData.titleTemplate = '';
        formData.suffix = '';
        formData.defaultPrice = '';
        formData.currentPeriod = '0';
        formData.randomCodeCount = '0';
        formTags.value = [];
    }
    showForm.value = true;
};

const addFormTag = () => {
    if (tagInput.value && !formTags.value.includes(tagInput.value)) {
        formTags.value.push(tagInput.value);
        tagInput.value = '';
    }
};

const handleSave = () => {
    if (!formData.name) {
        return uni.showToast({ title: '请填写系列名称', icon: 'none' });
    }
    if (!formData.titleTemplate) {
        return uni.showToast({ title: '请填写标题模板', icon: 'none' });
    }

    const postData: any = {
        name: formData.name,
        titleTemplate: formData.titleTemplate,
        suffix: formData.suffix,
        defaultPrice: parseFloat(formData.defaultPrice) || 0,
        defaultTags: JSON.stringify(formTags.value),
        currentPeriod: parseInt(formData.currentPeriod) || 0,
        randomCodeCount: parseInt(formData.randomCodeCount) || 0
    };

    if (editingId.value) {
        postData.id = editingId.value;
    }

    request({
        url: '/series/save',
        method: 'POST',
        data: postData
    }).then(() => {
        uni.showToast({ title: '保存成功' });
        showForm.value = false;
        loadList();
    });
};

const quickPublish = (item: any) => {
    uni.navigateTo({ url: `/pages/admin/content_publish?seriesId=${item.id}` });
};

const confirmDelete = (id: number) => {
    uni.showModal({
        title: '提示',
        content: '确定要删除此系列吗？',
        confirmColor: '#ff4757',
        success: (res) => {
            if (res.confirm) {
                request({
                    url: `/series/${id}`,
                    method: 'DELETE'
                }).then(() => {
                    uni.showToast({ title: '已删除' });
                    loadList();
                });
            }
        }
    });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
    padding: 24rpx;
}

.header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .page-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
    }
}

.series-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;

        .series-name {
            font-size: 32rpx;
            font-weight: bold;
            color: #333;
        }

        .period-badge {
            background: #fff0f0;
            padding: 6rpx 20rpx;
            border-radius: 20rpx;

            text {
                font-size: 24rpx;
                color: #ff4757;
                font-weight: 500;
            }
        }
    }

    .card-body {
        margin-bottom: 20rpx;

        .info-row {
            display: flex;
            align-items: center;
            margin-bottom: 10rpx;

            .info-label {
                font-size: 26rpx;
                color: #999;
                flex-shrink: 0;
            }

            .info-value {
                font-size: 26rpx;
                color: #333;

                &.price {
                    color: #ff4757;
                    font-weight: bold;
                }
            }
        }

        .preview-row {
            display: flex;
            align-items: flex-start;
            margin-top: 16rpx;
            padding-top: 16rpx;
            border-top: 1rpx dashed #eee;

            .info-label {
                font-size: 26rpx;
                color: #999;
                flex-shrink: 0;
            }

            .preview-text {
                font-size: 26rpx;
                color: #ff8c42;
                font-weight: 500;
            }
        }
    }

    .card-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 30rpx;
        padding-top: 20rpx;
        border-top: 1rpx solid #f5f5f5;

        .btn-text {
            font-size: 28rpx;
            padding: 10rpx 0;

            &.blue {
                color: #4e8df5;
            }

            &.red {
                color: #ff4757;
            }

            &.green {
                color: #37b24d;
            }
        }
    }
}

.empty-tip {
    text-align: center;
    padding: 120rpx 0;
    color: #ccc;
    font-size: 28rpx;
}

.form-popup {
    padding: 40rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));

    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;

        .popup-title {
            font-size: 34rpx;
            font-weight: bold;
            color: #333;
        }

        .popup-close {
            font-size: 36rpx;
            color: #999;
            padding: 10rpx;
        }
    }

    .form-content {
        padding: 0 10rpx;
    }

    .form-item {
        margin-bottom: 36rpx;

        .label {
            display: block;
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
            margin-bottom: 16rpx;

            .hint {
                font-weight: normal;
                font-size: 24rpx;
                color: #999;
            }
        }
    }

    .tags-row {
        margin-bottom: 10rpx;
    }

    .preview-box {
        .preview-card {
            background: #f8f9fa;
            border-radius: 12rpx;
            padding: 24rpx;
            border: 1rpx dashed #ddd;

            .preview-result {
                font-size: 30rpx;
                color: #ff8c42;
                font-weight: 500;
                line-height: 1.6;
            }
        }
    }

    .popup-footer {
        margin-top: 20rpx;
    }
}
</style>
