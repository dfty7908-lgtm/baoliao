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
            <view class="input-item">
                <up-icon name="phone-fill" size="20" color="#ff4757"></up-icon>
                <input v-model="form.phone" type="number" placeholder="请输入手机号" maxlength="11" />
            </view>

            <view class="input-item code-input">
                <up-icon name="email" size="20" color="#ff4757"></up-icon>
                <input v-model="form.code" type="number" placeholder="验证码" maxlength="6" />
                <view class="get-code" :class="{ disabled: timer > 0 }" @click="getCode">
                    {{ timer > 0 ? timer + 's' : '获取验证码' }}
                </view>
            </view>

            <view class="input-item">
                <up-icon name="lock" size="20" color="#ff4757"></up-icon>
                <input v-model="form.password" type="password" placeholder="设置新密码" />
            </view>

            <view class="input-item">
                <up-icon name="lock" size="20" color="#ccc"></up-icon>
                <input v-model="form.confirmPassword" type="password" placeholder="确认新密码" />
            </view>

            <up-button :loading="loading" text="确认重置"
                customStyle="height: 100rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; font-size: 32rpx; font-weight: bold; border-radius: 50rpx; border: none; margin-top: 60rpx;"
                @click="handleReset"></up-button>

            <view class="bottom-actions">
                <text @click="goLogin">返回登录</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue';
import { sendSms, resetPassword } from '@/api/user';

const loading = ref(false);
const timer = ref(0);
let interval: any = null;

const form = reactive({
    phone: '',
    code: '',
    password: '',
    confirmPassword: ''
});

const getCode = () => {
    if (timer.value > 0) return;
    if (!form.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' });
        return;
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' });
        return;
    }

    // 调用发送验证码接口
    sendSms(form.phone, 'RESET_PWD').then((res: any) => {
        if (res.code === 200) {
            uni.showToast({ title: '验证码已发送', icon: 'success' });
            timer.value = 60;
            interval = setInterval(() => {
                timer.value--;
                if (timer.value <= 0) clearInterval(interval);
            }, 1000);
        } else {
            uni.showToast({ title: res.msg || '发送失败', icon: 'none' });
        }
    }).catch(() => {
        uni.showToast({ title: '发送失败��请重试', icon: 'none' });
    });
};

const handleReset = () => {
    if (!form.phone || !form.code || !form.password || !form.confirmPassword) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' });
        return;
    }
    if (form.password.length < 6) {
        uni.showToast({ title: '密码至��6位', icon: 'none' });
        return;
    }
    if (form.password !== form.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
    }

    loading.value = true;
    resetPassword({
        phone: form.phone,
        code: form.code,
        password: form.password
    }).then((res: any) => {
        if (res.code === 200) {
            uni.showToast({ title: '密码重置成功', icon: 'success' });
            setTimeout(() => {
                uni.navigateBack();
            }, 1200);
        } else {
            uni.showToast({ title: res.msg || '重置失败', icon: 'none' });
        }
    }).catch(() => {
        uni.showToast({ title: '重置失败，请重试', icon: 'none' });
    }).finally(() => {
        loading.value = false;
    });
};

const goLogin = () => {
    uni.navigateBack();
};

onUnmounted(() => {
    if (interval) clearInterval(interval);
});
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
    padding: 80rpx 40rpx 40rpx;
    box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.05);

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

        &.code-input {
            .get-code {
                font-size: 26rpx;
                color: #ff4757;
                font-weight: bold;
                padding: 10rpx 0;
                min-width: 140rpx;
                text-align: right;

                &.disabled {
                    color: #ccc;
                }
            }
        }
    }

    .bottom-actions {
        display: flex;
        justify-content: center;
        margin-top: 40rpx;
        font-size: 26rpx;
        color: #999;
    }
}
</style>
