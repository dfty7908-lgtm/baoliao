<template>
    <view class="container">
        <view class="card">
            <!-- 系列选择（必选，仅新建时） -->
            <view class="form-item" v-if="!form.id">
                <text class="label">选择系列 <text class="required">*</text></text>
                <view class="series-selector" @click="showSeriesPicker = true">
                    <text v-if="selectedSeries" class="series-selected">{{ selectedSeries.name }} · 第{{ nextPeriod
                        }}期</text>
                    <text v-else class="series-placeholder">请选择系列</text>
                    <up-icon name="arrow-right" color="#999" size="16"></up-icon>
                </view>
            </view>

            <view class="form-item">
                <text class="label">文章标题</text>
                <up-input v-model="form.title" placeholder="请输入标题" border="bottom"></up-input>
            </view>

            <view class="form-item no-margin">
                <text class="label">分析内容</text>
                <view class="editor-wrapper">
                    <lsj-edit ref="lsjEdit" placeholder="输入核心预测、独家爆料内容..." :html="form.content" @onReady="editReady">
                        <template v-slot:btns="data">
                            <edit-btns :edit="data.edit" selectedColor="#ff4757"></edit-btns>
                        </template>
                    </lsj-edit>
                </view>
            </view>

            <view class="form-item">
                <text class="label">查看价格 (设置为0即为免费)</text>
                <up-input v-model="form.price" type="digit" placeholder="¥ 0.00" border="bottom">
                    <template #prefix>
                        <text style="margin-right: 10rpx; color: #333;">¥</text>
                    </template>
                </up-input>
            </view>

            <view class="form-item">
                <text class="label">标签设置 (回车添加)</text>
                <view class="tags-row">
                    <up-tag v-for="(tag, index) in form.tags" :key="index" :text="tag" closable type="error"
                        @close="removeTag(index)" customStyle="margin-right: 12rpx; margin-bottom: 12rpx;"></up-tag>
                </view>
                <up-input v-model="tagInput" placeholder="添加自定义标签" @confirm="addTag" border="bottom"></up-input>
                <view class="preset-wrap">
                    <text class="title">快捷：</text>
                    <view class="tags">
                        <text v-for="t in presetTags" :key="t" class="p-tag" @click="addPresetTag(t)">{{ t }}</text>
                    </view>
                </view>
            </view>

            <view class="switch-item">
                <text>是否上架</text>
                <up-switch v-model="form.isShelved" activeColor="#ff4757"></up-switch>
            </view>

            <view class="switch-item">
                <text>是否公开 (免费预览)</text>
                <up-switch v-model="form.isPublic" activeColor="#ff4757"></up-switch>
            </view>

            <view class="switch-item">
                <text>是否置顶</text>
                <up-switch v-model="form.isTop" activeColor="#ff4757"></up-switch>
            </view>
        </view>

        <view class="submit-bar">
            <up-button :text="form.id ? '保存修改' : '立即发布'" @click="handlePublish"
                customStyle="height: 100rpx; border-radius: 50rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); border: none; font-size: 32rpx; font-weight: bold; color: #fff;"></up-button>
        </view>

        <!-- 系列选择弹窗 -->
        <up-popup :show="showSeriesPicker" mode="bottom" :round="20" @close="showSeriesPicker = false">
            <view class="picker-popup">
                <view class="picker-header">
                    <text class="picker-title">选择系列</text>
                    <text class="picker-close" @click="showSeriesPicker = false">✕</text>
                </view>
                <scroll-view scroll-y style="max-height: 50vh;">
                    <view class="picker-item" v-for="s in seriesList" :key="s.id" @click="selectSeries(s)"
                        :class="{ active: selectedSeries && selectedSeries.id === s.id }">
                        <view class="picker-info">
                            <text class="picker-name">{{ s.name }}</text>
                            <text class="picker-period">下一期: 第{{ String((s.currentPeriod || 0) + 1).padStart(3, '0')
                                }}期</text>
                        </view>
                        <view class="picker-right">
                            <text class="picker-price">¥{{ s.defaultPrice || '0.00' }}</text>
                            <view class="picker-actions">
                                <text class="picker-edit" @click.stop="editSeries(s)">编辑</text>
                                <text class="picker-delete" @click.stop="confirmDeleteSeries(s)">删除</text>
                            </view>
                        </view>
                    </view>
                    <view class="empty-tip" v-if="seriesList.length === 0 && !showCreateForm">
                        <text>还没有系列，点击下方新建</text>
                    </view>
                </scroll-view>

                <!-- 新建/编辑系列 -->
                <view v-if="!showCreateForm" class="create-bar" @click="openCreateForm">
                    <text class="create-btn">+ 新建系列</text>
                </view>
                <view v-else class="create-form">
                    <view class="form-divider"></view>
                    <text class="form-label">{{ editingSeriesId ? '编辑系列' : '新建系列' }}</text>
                    <up-input v-model="newSeries.name" placeholder="系列名称，如：财运大师三中三" border="bottom"
                        customStyle="margin-bottom: 16rpx;"></up-input>
                    <up-input v-model="newSeries.titleTemplate" placeholder="标题模板，如：港澳{期号}期 财运大师三中三" border="bottom"
                        customStyle="margin-bottom: 16rpx;"></up-input>
                    <up-input v-model="newSeries.defaultPrice" type="digit" placeholder="默认价格" border="bottom"
                        customStyle="margin-bottom: 16rpx;"></up-input>
                    <up-input v-model="newSeries.currentPeriod" type="number" placeholder="当前期号，如填14则下一期为15"
                        border="bottom" customStyle="margin-bottom: 16rpx;"></up-input>
                    <up-input v-model="newSeries.randomCodeCount" type="number" placeholder="随机码数量 (1-49)"
                        border="bottom" customStyle="margin-bottom: 16rpx;"></up-input>
                    <view class="create-actions">
                        <text class="cancel-btn" @click="cancelForm">取消</text>
                        <text class="save-btn" @click="handleSaveSeries">保存</text>
                    </view>
                </view>
            </view>
        </up-popup>
    </view>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import config from '@/utils/config';
import editBtns from '@/uni_modules/lsj-edit/components/lsj-edit/edit-btns/edit-btns.vue';
import LsjEdit from '@/uni_modules/lsj-edit/components/lsj-edit/lsj-edit.vue';

const lsjEdit = ref();
const editInstance = ref<any>(null);
const tagInput = ref('');
const presetTags = ['已实名制认证', '一码中特', '二码中特', '三码中特', '四码中特', '五码中特', '六码中特', '七码中特', '八码中特', '九码中特', '十码中特'];

const seriesList = ref<any[]>([]);
const selectedSeries = ref<any>(null);
const showSeriesPicker = ref(false);
const showCreateForm = ref(false);
const editingSeriesId = ref<number | null>(null);

const newSeries = reactive({ name: '', titleTemplate: '', defaultPrice: '', currentPeriod: '', randomCodeCount: '' });

const form = reactive<any>({
    id: null, title: '', content: '', price: '', tags: [],
    isShelved: true, isPublic: false, isTop: false, winStreak: 0,
    seriesId: null, periodNumber: null, isAnnouncement: 0
});

const nextPeriod = computed(() => {
    if (!selectedSeries.value) return '';
    return String((selectedSeries.value.currentPeriod || 0) + 1).padStart(3, '0');
});

onLoad((options: any) => {
    if (options.id) {
        uni.setNavigationBarTitle({ title: '编辑内容' });
        loadDetail(options.id);
    } else {
        loadSeriesList(options.seriesId);
    }
});

const loadSeriesList = (preSelectId?: string) => {
    request({ url: '/series/list' }).then((res: any) => {
        seriesList.value = res.data || [];
        if (preSelectId) {
            const target = seriesList.value.find((s: any) => String(s.id) === String(preSelectId));
            if (target) selectSeries(target);
        }
    });
};

const selectSeries = (series: any) => {
    showSeriesPicker.value = false;
    selectedSeries.value = series;
    form.seriesId = series.id;
    const period = String((series.currentPeriod || 0) + 1).padStart(3, '0');
    form.title = (series.titleTemplate || '').replace('{期号}', period);
    form.price = String(series.defaultPrice || '');
    form.periodNumber = (series.currentPeriod || 0) + 1;

    // Auto generate random codes if enabled
    if (series.randomCodeCount && series.randomCodeCount > 0) {
        const codes = generateRandomCodes(series.randomCodeCount);
        const html = `<p style="font-size: 36rpx; color: #ff4757; font-weight: bold;">${codes}</p>`;
        form.content = html;
        if (editInstance.value) {
            editInstance.value.ready(html);
        }
    }

    // Auto tagging
    form.tags = ['已实名制认证'];
    if (series.randomCodeCount && series.randomCodeCount > 0) {
        const chineseNum = numToChinese(series.randomCodeCount);
        form.tags.push(`${chineseNum}码中特`);
    }
};

const numToChinese = (num: number) => {
    const chineseChars = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (num <= 10) return chineseChars[num];
    if (num < 20) return '十' + (num % 10 === 0 ? '' : chineseChars[num % 10]);
    const unit = num % 10 === 0 ? '' : chineseChars[num % 10];
    return chineseChars[Math.floor(num / 10)] + '十' + unit;
};

const generateRandomCodes = (count: number) => {
    const numbers: number[] = [];
    while (numbers.length < count) {
        const num = Math.floor(Math.random() * 49) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    return numbers.sort((a, b) => a - b).map(n => String(n).padStart(2, '0')).join('，');
};

const resetForm = () => {
    newSeries.name = '';
    newSeries.titleTemplate = '';
    newSeries.defaultPrice = '';
    newSeries.currentPeriod = '';
    editingSeriesId.value = null;
};

const openCreateForm = () => {
    resetForm();
    showCreateForm.value = true;
};

const cancelForm = () => {
    showCreateForm.value = false;
    resetForm();
};

const editSeries = (series: any) => {
    editingSeriesId.value = series.id;
    newSeries.name = series.name || '';
    newSeries.titleTemplate = series.titleTemplate || '';
    newSeries.defaultPrice = String(series.defaultPrice || '');
    newSeries.currentPeriod = String(series.currentPeriod || 0);
    newSeries.randomCodeCount = String(series.randomCodeCount || 0);
    showCreateForm.value = true;
};

const handleSaveSeries = () => {
    if (!newSeries.name) return uni.showToast({ title: '请填写系列名称', icon: 'none' });
    if (!newSeries.titleTemplate) return uni.showToast({ title: '请填写标题模板', icon: 'none' });

    const data: any = {
        name: newSeries.name,
        titleTemplate: newSeries.titleTemplate,
        defaultPrice: parseFloat(newSeries.defaultPrice) || 0,
        currentPeriod: parseInt(newSeries.currentPeriod) || 0,
        randomCodeCount: parseInt(newSeries.randomCodeCount) || 0
    };
    if (editingSeriesId.value) {
        data.id = editingSeriesId.value;
    }

    request({
        url: '/series/save', method: 'POST',
        data
    }).then(() => {
        uni.showToast({ title: editingSeriesId.value ? '已保存' : '已创建' });
        showCreateForm.value = false;
        const wasEditing = editingSeriesId.value;
        resetForm();
        request({ url: '/series/list' }).then((res2: any) => {
            seriesList.value = res2.data || [];
            if (!wasEditing && seriesList.value.length > 0) {
                selectSeries(seriesList.value[0]);
            }
        });
    });
};

const editReady = (edit: any) => { editInstance.value = edit; };

const loadDetail = (id: string) => {
    request({ url: `/content/admin/${id}` }).then((res: any) => {
        if (res.code === 200) {
            Object.assign(form, res.data);
            form.isShelved = res.data.isShelved === 1;
            form.isPublic = res.data.isPublic === 1;
            form.isTop = res.data.isTop === 1;
            if (editInstance.value) editInstance.value.ready(res.data.content);
            try { form.tags = JSON.parse(res.data.tags || '[]'); } catch (e) { form.tags = []; }
        }
    });
};

const uploadFilePromise = (url: string) => {
    return new Promise((resolve, reject) => {
        if (url.indexOf('http') === 0) return resolve(url);
        uni.uploadFile({
            url: config.baseUrl + '/upload/image', filePath: url, name: 'file',
            success: (res) => { resolve(JSON.parse(res.data).data); },
            fail: reject
        });
    });
};

const addTag = () => { if (tagInput.value && !form.tags.includes(tagInput.value)) { form.tags.push(tagInput.value); tagInput.value = ''; } };
const removeTag = (idx: number) => { form.tags.splice(idx, 1); };
const addPresetTag = (tag: string) => { if (!form.tags.includes(tag)) form.tags.push(tag); };

const confirmDeleteSeries = (series: any) => {
    showSeriesPicker.value = false;
    setTimeout(() => {
        uni.showModal({
            title: '提示',
            content: '删除系列「' + series.name + '」将同时删除该系列下所有内容，确定删除？',
            confirmColor: '#ff4757',
            success: (res) => {
                if (res.confirm) {
                    request({
                        url: `/series/${series.id}`,
                        method: 'DELETE'
                    }).then(() => {
                        uni.showToast({ title: '已删除' });
                        if (selectedSeries.value && selectedSeries.value.id === series.id) {
                            selectedSeries.value = null;
                            form.seriesId = null;
                        }
                        loadSeriesList();
                    });
                } else {
                    showSeriesPicker.value = true;
                }
            }
        });
    }, 300);
};

const handlePublish = async () => {
    if (!form.id && !form.seriesId) return uni.showToast({ title: '请先选择系列', icon: 'none' });
    if (!form.title) return uni.showToast({ title: '请填写标题', icon: 'none' });
    if (!editInstance.value) return uni.showToast({ title: '编辑器未就绪', icon: 'none' });

    uni.showLoading({ title: '正在同步内容...', mask: true });

    try {
        const res = await editInstance.value.replaceImage(async (img: string) => await uploadFilePromise(img));
        const finalContent = res.html;
        if (!finalContent || finalContent === '<p><br></p>') {
            uni.hideLoading();
            return uni.showToast({ title: '请填写分析内容', icon: 'none' });
        }
        form.content = finalContent;

        request({
            url: '/content/save', method: 'POST',
            data: { ...form, tags: JSON.stringify(form.tags), isShelved: form.isShelved ? 1 : 0, isPublic: form.isPublic ? 1 : 0, isTop: form.isTop ? 1 : 0 }
        }).then(() => {
            uni.hideLoading();
            uni.showToast({ title: '已发布' });
            setTimeout(() => uni.navigateBack(), 1500);
        });
    } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '发布过程中出现错误', icon: 'none' });
    }
};
</script>

<style lang="scss" scoped>
.container {
    padding: 30rpx 30rpx 180rpx;
    background-color: #f7f8fa;
    min-height: 100vh;
}

.card {
    background: #fff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
}

.form-item {
    margin-bottom: 40rpx;

    &.no-margin {
        margin-bottom: 0;
    }

    .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        font-weight: bold;
        margin-bottom: 20rpx;

        .required {
            color: #ff4757;
        }

        .hint {
            font-weight: normal;
            font-size: 24rpx;
            color: #999;
        }
    }
}

.series-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    border: 1rpx solid #eee;

    .series-selected {
        font-size: 28rpx;
        color: #ff4757;
        font-weight: 500;
    }

    .series-placeholder {
        font-size: 28rpx;
        color: #999;
    }
}

.editor-wrapper {
    border: 1rpx solid #eee;
    border-radius: 12rpx;
    overflow: hidden;
    min-height: 400rpx;
    background: #fff;
}

.tags-row {
    margin-bottom: 15rpx;
}

.preset-wrap {
    margin-top: 15rpx;
    display: flex;
    align-items: flex-start;

    .title {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
    }

    .tags {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 15rpx;

        .p-tag {
            font-size: 22rpx;
            color: #ff4757;
            background: #fff0f0;
            padding: 4rpx 16rpx;
            border-radius: 8rpx;
        }
    }
}

.switch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;
    border-top: 1rpx solid #f5f5f5;
    font-size: 28rpx;
    color: #333;
}

.submit-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 30rpx 40rpx calc(30rpx + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
    z-index: 99;
}

.picker-popup {
    padding: 40rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));

    .picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;

        .picker-title {
            font-size: 34rpx;
            font-weight: bold;
            color: #333;
        }

        .picker-close {
            font-size: 36rpx;
            color: #999;
            padding: 10rpx;
        }
    }

    .picker-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 28rpx 20rpx;
        border-bottom: 1rpx solid #f5f5f5;
        border-radius: 12rpx;

        &.active {
            background: #fff0f0;
        }

        .picker-info {
            flex: 1;
        }

        .picker-name {
            font-size: 30rpx;
            color: #333;
            font-weight: 500;
        }

        .picker-period {
            display: block;
            font-size: 24rpx;
            color: #999;
            margin-top: 8rpx;
        }

        .picker-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8rpx;
        }

        .picker-price {
            font-size: 30rpx;
            color: #ff4757;
            font-weight: bold;
        }

        .picker-actions {
            display: flex;
            gap: 20rpx;
        }

        .picker-edit {
            font-size: 24rpx;
            color: #ff8c42;
        }

        .picker-delete {
            font-size: 24rpx;
            color: #ff4757;
        }
    }

    .empty-tip {
        text-align: center;
        padding: 40rpx 0;

        text {
            font-size: 26rpx;
            color: #ccc;
        }
    }

    .create-bar {
        padding: 28rpx 20rpx;
        text-align: center;

        .create-btn {
            font-size: 30rpx;
            color: #ff4757;
            font-weight: 500;
        }
    }

    .create-form {
        padding: 10rpx 10rpx 0;

        .form-divider {
            height: 1rpx;
            background: #eee;
            margin-bottom: 20rpx;
        }

        .form-label {
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
            margin-bottom: 16rpx;
            display: block;
        }

        .create-actions {
            display: flex;
            justify-content: flex-end;
            gap: 30rpx;
            margin-top: 20rpx;

            .cancel-btn {
                font-size: 28rpx;
                color: #999;
                padding: 16rpx 30rpx;
            }

            .save-btn {
                font-size: 28rpx;
                color: #fff;
                background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
                padding: 16rpx 40rpx;
                border-radius: 40rpx;
                font-weight: 500;
            }
        }
    }
}
</style>
