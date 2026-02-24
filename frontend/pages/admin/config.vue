<template>
    <view class="container">
        <view class="header">
            <text class="title">系统设置中心</text>
            <text class="subtitle">管理系统支付参数、联系方式及基础运行配置</text>
        </view>

        <!-- General Settings Section -->
        <view class="section-title">
            <up-icon name="setting-fill" color="#1e293b" size="18"></up-icon>
            <text>基础配置</text>
        </view>
        <view class="card">
            <view v-for="(val, key) in generalConfigs" :key="key" class="form-item">
                <view class="item-header">
                    <text class="label">{{ keyMap[key] || key }}</text>
                    <text class="key-tag">{{ key }}</text>
                </view>
                <view class="input-row">
                    <!-- Image Preview for QR Codes -->
                    <template v-if="String(key).toLowerCase().includes('qrcode')">
                        <view class="preview-box" @click="handleUpload(String(key))">
                            <image v-if="form[key]" :src="form[key]" mode="aspectFit" class="preview-img"></image>
                            <view v-else class="upload-placeholder">
                                <up-icon name="plus" color="#cbd5e1" size="20"></up-icon>
                                <text>等待上传</text>
                            </view>
                        </view>
                    </template>
                    <!-- Normal Input for others -->
                    <up-input v-else v-model="form[key]" border="bottom"
                        customStyle="background: #fdfdfd; padding: 10rpx 0;"></up-input>

                    <view v-if="String(key).toLowerCase().includes('qrcode')" class="upload-btn"
                        @click="handleUpload(String(key))">
                        <up-icon name="camera-fill" color="#ff4757" size="18"></up-icon>
                        <text>{{ form[key] ? '重新上传' : '上传图片' }}</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="btn-group">
            <up-button class="btn-save" text="保存所有更改" @click="handleSave"></up-button>
        </view>

        <view class="footer">
            <text>BAOLIAO ADMIN SYSTEM · V1.0</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import config from '@/utils/config';

const form = reactive<any>({});

// Configuration mapping for better UX
const keyMap: any = {
    'payment_app_id': '支付接口 AppID',
    'payment_app_key': '支付接口 密钥 (Key)',
    'payment_merchant_id': '支付接口 商户号',
    'payment_notify_url': '支付接口 回调地址',
    'contact_official_account': '公众号名称',
    'contact_official_qrcode': '公众号二维码 (路径)',
    'contact_wechat_id': '客服微信号',
    'contact_wechat_qrcode': '客服微信二维码 (路径)'
};

const payKeys = ['payment_app_id', 'payment_app_key', 'payment_merchant_id', 'payment_notify_url'];
const systemKeys = ['contact_official_account', 'contact_official_qrcode', 'contact_wechat_id', 'contact_wechat_qrcode'];

const generalConfigs = computed(() => {
    const res: any = {};
    // Show both system and pay keys in a single list for simplicity
    [...systemKeys, ...payKeys].forEach(k => {
        if (form[k] !== undefined) res[k] = form[k];
    });
    return res;
});

const loadConfig = () => {
    request({
        url: '/config/list'
    }).then((res: any) => {
        Object.keys(form).forEach(key => delete form[key]);
        res.data.forEach((item: any) => {
            form[item.configKey] = item.configValue;
        });

        // Ensure keys exist in form even if empty
        [...payKeys, ...systemKeys].forEach(k => { if (form[k] === undefined) form[k] = ''; });
    });
};

const handleSave = () => {
    // Only send keys that are actually shown in the UI (incremental update)
    const dataToSave: any = {};
    [...payKeys, ...systemKeys].forEach(key => {
        if (form[key] !== undefined) {
            dataToSave[key] = form[key];
        }
    });

    request({
        url: '/config/update',
        method: 'POST',
        data: dataToSave
    }).then(() => {
        uni.showToast({ title: '配置已同步' });
        loadConfig();
    });
};

const handleUpload = (key: string) => {
    uni.chooseImage({
        count: 1,
        success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            uni.showLoading({ title: '上传中...' });
            uni.uploadFile({
                url: `${config.baseUrl}/upload/image`,
                filePath: tempFilePath,
                name: 'file',
                success: (uploadRes) => {
                    uni.hideLoading();
                    const data = JSON.parse(uploadRes.data);
                    if (data.code === 200) {
                        form[key] = data.data;
                        uni.showToast({ title: '预览图已更新' });
                    } else {
                        uni.showToast({ title: data.msg || '上传失败', icon: 'none' });
                    }
                },
                fail: () => {
                    uni.hideLoading();
                    uni.showToast({ title: '上传异常', icon: 'none' });
                }
            });
        }
    });
};

onLoad(() => {
    loadConfig();
});
</script>

<script lang="ts">
export default {
    options: {
        styleIsolation: 'shared'
    }
}
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f8fafc;
    padding-bottom: 60rpx;
}

.header {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    padding: 80rpx 40rpx 100rpx;

    .title {
        font-size: 40rpx;
        font-weight: bold;
        color: #fff;
        display: block;
    }

    .subtitle {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 12rpx;
        display: block;
    }
}

.section-title {
    padding: 30rpx 40rpx 10rpx;
    display: flex;
    align-items: center;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    gap: 12rpx;
    margin-top: 20rpx;

    .auto-btn {
        margin-left: auto;
        font-size: 22rpx;
        color: #ff4757;
        font-weight: normal;
        text-decoration: underline;
    }
}

.card {
    background: #fff;
    padding: 40rpx;
    margin: 20rpx 30rpx 10rpx;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

    .form-item {
        margin-bottom: 30rpx;

        &:last-child {
            margin-bottom: 0;
        }

        .item-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12rpx;

            .label {
                font-size: 26rpx;
                color: #475569;
            }

            .key-tag {
                font-size: 20rpx;
                color: #94a3b8;
                background: #f1f5f9;
                padding: 2rpx 10rpx;
                border-radius: 4rpx;
            }

            .delete-btn {
                font-size: 22rpx;
                color: #ef4444;
            }
        }

        .input-row {
            display: flex;
            align-items: center;
            gap: 20rpx;

            .preview-box {
                width: 140rpx;
                height: 140rpx;
                background: #f8fafc;
                border-radius: 12rpx;
                overflow: hidden;
                border: 1rpx solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: center;

                .preview-img {
                    width: 100%;
                    height: 100%;
                }

                .upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;

                    text {
                        font-size: 20rpx;
                        color: #94a3b8;
                        margin-top: 8rpx;
                    }
                }
            }

            .upload-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 120rpx;
                height: 80rpx;
                border: 1rpx dashed #ff4757;
                border-radius: 8rpx;
                background: #fff5f5;
                font-size: 20rpx;
                color: #ff4757;
                flex-shrink: 0;

                text {
                    margin-top: 4rpx;
                }
            }
        }
    }
}

.btn-group {
    margin-top: 60rpx;
    padding: 0 30rpx;

    .btn-save {
        border: none;
        height: 100rpx;
        border-radius: 50rpx;
        background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%) !important;
        color: #fff !important;
        font-weight: bold;
        font-size: 32rpx;
        box-shadow: 0 12rpx 24rpx rgba(255, 71, 87, 0.3);
    }

    .btn-add {
        border: 1rpx solid #e2e8f0 !important;
        height: 88rpx;
        border-radius: 44rpx;
        font-size: 26rpx;
    }
}

.modal-form {
    padding: 20rpx 0;
}

.footer {
    text-align: center;
    padding: 80rpx 0 40rpx;
    font-size: 20rpx;
    color: #cbd5e1;
    letter-spacing: 2rpx;
}

:deep(.up-button) {
    border: none !important;
}

:deep(.up-input) {
    padding-left: 0 !important;
    padding-right: 0 !important;
}
</style>
