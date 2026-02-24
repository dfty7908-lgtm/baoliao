<template>
    <view class="container">
        <view class="header">
            <text class="title">短信服务配置</text>
            <text class="subtitle">管理短信验证码发送参数（目前接入短信宝）</text>
        </view>

        <view class="section-title">
            <up-icon name="setting-fill" color="#1e293b" size="18"></up-icon>
            <text>短信宝 (SmsBao) 参数</text>
        </view>

        <view class="card">
            <view class="form-item">
                <view class="item-header">
                    <text class="label">短信宝账号 (User)</text>
                </view>
                <up-input v-model="form.accessKeyId" border="bottom" placeholder="请输入短信宝账号"
                    customStyle="background: #fdfdfd; padding: 10rpx 0;"></up-input>
            </view>

            <view class="form-item">
                <view class="item-header">
                    <text class="label">短信宝密钥 (Key/Password)</text>
                </view>
                <up-input v-model="form.accessKeySecret" type="password" border="bottom" placeholder="请输入密钥或MD5后的密码"
                    customStyle="background: #fdfdfd; padding: 10rpx 0;"></up-input>
            </view>

            <view class="form-item">
                <view class="item-header">
                    <text class="label">短信模板内容 (含签名)</text>
                </view>
                <up-textarea v-model="form.templateCode" placeholder="【esen管家】您的验证码是{0}。如非本人操作，请忽略本短信"
                    customStyle="background: #fdfdfd; padding: 20rpx 0;"></up-textarea>
                <text class="hint-text">请务必包含签名（如【料王爆料】）和占位符 {0} (验证码)</text>
            </view>
        </view>

        <view class="btn-group">
            <up-button class="btn-save" text="保存配置" @click="handleSave"></up-button>
        </view>

        <view class="footer">
            <text>SMS CONFIG SERVICE · DUANXINBAO</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const form = reactive<any>({
    id: null,
    provider: '0',
    accessKeyId: '',
    accessKeySecret: '',
    signName: '',
    templateCode: '【{0}】您的验证码是{1}，5分钟内有效。',
    endpoint: 'http://api.smsbao.com/sms',
    enabled: '1'
});

const loadConfig = () => {
    request({
        url: '/sms/config'
    }).then((res: any) => {
        if (res.code === 200 && res.data && res.data.id) {
            Object.assign(form, res.data);
        }
    });
};

const handleSave = () => {
    if (!form.accessKeyId || !form.accessKeySecret) {
        uni.showToast({ title: '账号和密钥不能为空', icon: 'none' });
        return;
    }
    request({
        url: '/sms/config/update',
        method: 'POST',
        data: form
    }).then(() => {
        uni.showToast({ title: '配置保存成功' });
        loadConfig();
    });
};

onLoad(() => {
    loadConfig();
});
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
            margin-bottom: 12rpx;

            .label {
                font-size: 26rpx;
                color: #475569;
                font-weight: 500;
            }
        }

        .hint-text {
            font-size: 22rpx;
            color: #94a3b8;
            margin-top: 10rpx;
            display: block;
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
}

.footer {
    text-align: center;
    padding: 80rpx 0 40rpx;
    font-size: 20rpx;
    color: #cbd5e1;
    letter-spacing: 2rpx;
}
</style>
