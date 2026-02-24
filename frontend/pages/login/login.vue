<template>
    <view class="container">
        <view class="header-banner">
            <view class="logo-box">
                <image src="/static/logo.png" mode="aspectFit" class="logo-img"></image>
            </view>
            <view class="app-name">料王爆料平台</view>
            <view class="app-slogan">最专业的情报服务站</view>
        </view>

        <view class="form-card">
            <view class="tab-header">密码登录</view>

            <view class="input-item">
                <up-icon name="phone-fill" size="20" color="#ff4757"></up-icon>
                <input v-model="form.phone" type="number" placeholder="请输入手机号" maxlength="11" />
            </view>

            <view class="input-item">
                <up-icon name="lock" size="20" color="#ff4757"></up-icon>
                <input v-model="form.password" type="password" placeholder="请输入密码" />
            </view>

            <up-button :loading="loading" text="立即进入"
                customStyle="height: 100rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; font-size: 32rpx; font-weight: bold; border-radius: 50rpx; border: none; margin-top: 60rpx;"
                @click="handleLogin"></up-button>

            <view class="wechat-login-box" v-if="isWechatBrowser">
                <view class="divider-text">
                    <view class="line"></view>
                    <text>微信快捷登录</text>
                    <view class="line"></view>
                </view>
                <view class="wechat-icon-btn" @click="handleWechatLogin">
                    <up-icon name="weixin-fill" size="32" color="#07c160"></up-icon>
                </view>
            </view>

            <view class="bottom-actions">
                <text @click="goRegister">新用户注册</text>
                <text class="divider">|</text>
                <text @click="goForgot">找回密码</text>
            </view>

            <view class="protocol">登录即代表您同意《用户协议》和《隐私政策》</view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { login } from '@/api/user';
import websocket from '@/utils/websocket';

const loading = ref(false);
const isWechatBrowser = ref(false);
const form = reactive({
    phone: '',
    password: ''
});

onShow(() => {
    // #ifdef H5
    const systemInfo = uni.getSystemInfoSync();
    const ua = (systemInfo.ua || '').toLowerCase();
    isWechatBrowser.value = ua.indexOf('micromessenger') !== -1;
    // #endif

    // In dev, show it for easier styling
    isWechatBrowser.value = true;
});

const handleWechatLogin = () => {
    uni.showToast({ title: '功能暂未开通', icon: 'none' });
};

const handleLogin = () => {
    if (!form.phone || !form.password) {
        uni.showToast({ title: '请输入完整', icon: 'none' });
        return;
    }
    loading.value = true;
    login(form).then((res: any) => {
        // request.ts handles non-200 code global toast
        if (res.code === 200 && res.data) {
            uni.setStorageSync('token', res.data.token);
            uni.setStorageSync('userId', res.data.user.id);
            uni.setStorageSync('userInfo', res.data.user);
            
            // Establish/Refresh WebSocket immediately after login
            websocket.reconnect(res.data.user.id);
            
            uni.showToast({ title: '登录成功' });
            setTimeout(() => {
                uni.switchTab({ url: '/pages/index/index' });
            }, 1200);
        }
    }).finally(() => {
        loading.value = false;
    });
};

const goRegister = () => {
    uni.navigateTo({ url: '/pages/register/register' });
};

const goForgot = () => {
    uni.navigateTo({ url: '/pages/login/reset-password' });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background: #f7f8fa;
    display: flex;
    flex-direction: column;
}

.header-banner {
    height: 480rpx;
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-bottom-left-radius: 80rpx;
    border-bottom-right-radius: 80rpx;
    padding-bottom: 40rpx;

    .logo-box {
        width: 140rpx;
        height: 140rpx;
        background: #fff;
        border-radius: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
        margin-bottom: 24rpx;
        overflow: hidden;

        .logo-img {
            width: 100%;
            height: 100%;
        }
    }

    .app-name {
        font-size: 44rpx;
        font-weight: 800;
        color: #fff;
        letter-spacing: 2rpx;
        margin-bottom: 8rpx;
    }

    .app-slogan {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
    }
}

.form-card {
    margin: -80rpx 50rpx 0;
    background: #fff;
    border-radius: 36rpx;
    padding: 60rpx 40rpx 40rpx;
    box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.05);

    .tab-header {
        font-size: 36rpx;
        font-weight: 800;
        color: #333;
        margin-bottom: 50rpx;
        padding-left: 10rpx;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            left: 0;
            top: 20%;
            width: 6rpx;
            height: 60%;
            background: #ff4757;
            border-radius: 3rpx;
        }
    }

    .input-item {
        display: flex;
        align-items: center;
        border-bottom: 1rpx solid #efefef;
        padding: 30rpx 0;
        margin-bottom: 20rpx;

        input {
            flex: 1;
            margin-left: 24rpx;
            font-size: 30rpx;
            color: #333;
        }
    }

    .wechat-login-box {
        margin-top: 60rpx;
        display: flex;
        flex-direction: column;
        align-items: center;

        .divider-text {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 32rpx;

            .line {
                flex: 1;
                height: 1rpx;
                background: #eee;
            }

            text {
                font-size: 24rpx;
                color: #ccc;
                margin: 0 24rpx;
            }
        }

        .wechat-icon-btn {
            width: 88rpx;
            height: 88rpx;
            background: #f0fdf4;
            border-radius: 44rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1rpx solid #dcfce7;
            transition: all 0.2s;

            &:active {
                transform: scale(0.9);
                background: #dcfce7;
            }
        }
    }

    .bottom-actions {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 40rpx;
        font-size: 26rpx;
        color: #999;

        .divider {
            margin: 0 24rpx;
            color: #eee;
        }
    }
}

.protocol {
    margin-top: 40rpx;
    text-align: center;
    font-size: 22rpx;
    color: #bbb;
}
</style>
