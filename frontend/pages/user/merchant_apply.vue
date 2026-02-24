<template>
    <view class="container">
        <view class="content">
            <view class="section-title">基本资料</view>
            <view class="card">
                <view class="form-item">
                    <view class="label">姓名</view>
                    <up-input v-model="form.name" placeholder="请输入商家姓名" border="none" activeColor="#ff4757"></up-input>
                </view>
                <view class="form-item">
                    <view class="label">手机号</view>
                    <up-input v-model="form.phone" type="number" placeholder="请输入手机号" border="none"
                        activeColor="#ff4757"></up-input>
                </view>
                <view class="form-item">
                    <view class="label">验证码</view>
                    <view class="code-row">
                        <up-input v-model="form.code" type="number" placeholder="请输入验证码" border="none"
                            activeColor="#ff4757"></up-input>
                        <up-button :text="codeBtnText" type="primary" size="mini" :disabled="counting" @click="sendCode"
                            customStyle="width: 200rpx; height: 64rpx; background-color: #ff4757; border: none;"></up-button>
                    </view>
                </view>
                <view class="form-item">
                    <view class="label">微信号</view>
                    <up-input v-model="form.wechatId" placeholder="请输入微信号" border="none"
                        activeColor="#ff4757"></up-input>
                </view>
                <view class="form-item">
                    <view class="label">粉丝数</view>
                    <up-input v-model="form.fansCount" placeholder="请输入粉丝数" border="none"
                        activeColor="#ff4757"></up-input>
                </view>
                <view class="form-item last">
                    <view class="label">公众号</view>
                    <up-input v-model="form.officialAccount" placeholder="选填公众号" border="none"
                        activeColor="#ff4757"></up-input>
                </view>
            </view>

            <view class="section-title">申请说明</view>
            <view class="card">
                <view class="form-item no-border">
                    <up-textarea v-model="form.description" placeholder="请填写申请入驻说明..." count limitType="char"
                        maxlength="50" border="none" customStyle="padding: 10rpx 0;"
                        activeColor="#ff4757"></up-textarea>
                </view>
            </view>

            <view class="protocol-row" @click="form.agreed = !form.agreed">
                <view class="checkbox" :class="{ checked: form.agreed }">
                    <up-icon v-if="form.agreed" name="checkbox-mark" size="14" color="#fff"></up-icon>
                </view>
                <text class="p-text">请阅读并同意 <text class="link" @click.stop="goProtocol">《商家入驻协议》</text></text>
            </view>

            <view class="submit-btn-box">
                <up-button text="提交申请" type="primary" shape="circle" @click="handleSubmit"
                    customStyle="height: 100rpx; font-weight: bold; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); border: none;"></up-button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { request } from '@/utils/request';

const form = reactive({
    name: '',
    phone: '',
    code: '',
    wechatId: '',
    fansCount: '',
    officialAccount: '',
    description: '',
    agreed: false
});

const counting = ref(false);
const codeBtnText = ref('发送验证码');
let timer: any = null;

const sendCode = () => {
    if (!form.phone || form.phone.length !== 11) {
        return uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    }
    if (counting.value) return;

    uni.showLoading({ title: '发送中...' });
    request({
        url: '/sms/send',
        method: 'POST',
        data: { phone: form.phone, type: 'MERCHANT_APPLY' }
    }).then((res: any) => {
        uni.hideLoading();
        uni.showToast({ title: '验证码已发送' });
        startCount();
    }).catch(() => {
        uni.hideLoading();
    });
};

const startCount = () => {
    counting.value = true;
    let seconds = 60;
    codeBtnText.value = `${seconds}s后重发`;
    timer = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(timer);
            counting.value = false;
            codeBtnText.value = '发送验证码';
        } else {
            codeBtnText.value = `${seconds}s后重发`;
        }
    }, 1000);
};

const goProtocol = () => {
    uni.navigateTo({ url: '/pages/common/service-terms' });
};

const handleSubmit = () => {
    if (!form.name) return uni.showToast({ title: '请输入姓名', icon: 'none' });
    if (!form.phone) return uni.showToast({ title: '请输入手机号', icon: 'none' });
    if (!form.code) return uni.showToast({ title: '请输入验证码', icon: 'none' });
    if (!form.wechatId) return uni.showToast({ title: '请输入微信号', icon: 'none' });
    if (!form.fansCount) return uni.showToast({ title: '请输入粉丝数', icon: 'none' });
    if (!form.agreed) return uni.showToast({ title: '请勾选入驻协议', icon: 'none' });

    uni.showLoading({ title: '提交中...' });
    request({
        url: '/merchant/apply/submit',
        method: 'POST',
        data: form
    }).then((res: any) => {
        uni.hideLoading();
        uni.showModal({
            title: '提交成功',
            content: '您的审核已在处理中，请耐心等待',
            showCancel: false,
            success: () => {
                uni.navigateBack();
            }
        });
    }).catch(() => {
        uni.hideLoading();
    });
};
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
}

.content {
    padding: 30rpx;
}

.section-title {
    font-size: 28rpx;
    color: #999;
    margin: 30rpx 0 20rpx 10rpx;
}

.card {
    background: #fff;
    border-radius: 16rpx;
    padding: 0 30rpx;
    margin-bottom: 30rpx;
}

.form-item {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &.last {
        border-bottom: none;
    }

    &.no-border {
        border-bottom: none;
    }

    .label {
        width: 140rpx;
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
    }

    .code-row {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
}

.protocol-row {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 60rpx;

    .checkbox {
        width: 32rpx;
        height: 32rpx;
        border: 2rpx solid #ccc;
        border-radius: 50%;
        margin-right: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        &.checked {
            background-color: #ff4757;
            border-color: #ff4757;
        }
    }

    .p-text {
        font-size: 26rpx;
        color: #666;

        .link {
            color: #ff4757;
        }
    }
}

.submit-btn-box {
    margin-top: 40rpx;
    padding: 0 10rpx;
}
</style>
