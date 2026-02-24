<template>
    <view class="container">
        <!-- Background Decor -->
        <view class="bg-decor"></view>


        <view class="content-wrapper">
            <view class="card">
                <view class="avatar-section" @click="handleUploadAvatar">
                    <view class="avatar-box">
                        <image :src="userInfo.avatar || '/static/logo.png'" mode="aspectFill" class="avatar-img">
                        </image>
                        <view class="edit-badge">
                            <up-icon name="camera-fill" size="14" color="#fff"></up-icon>
                        </view>
                    </view>
                    <text class="tip">点击更换头像</text>
                </view>

                <view class="form-group">
                    <view class="form-item">
                        <text class="label">昵称</text>
                        <input class="input" type="text" v-model="userInfo.nickname" placeholder="请输入昵称"
                            placeholder-class="placeholder" />
                        <up-icon name="edit-pen" size="18" color="#ccc"></up-icon>
                    </view>

                    <view class="form-item" @click="openModal('mobile')">
                        <text class="label">手机号</text>
                        <text class="value">{{ userInfo.phone || '未绑定' }}</text>
                        <up-icon name="phone" size="16" color="#eee"></up-icon>
                    </view>

                    <view class="form-item" @click="openModal('password')">
                        <text class="label">登录密码</text>
                        <text class="value">点击修改</text>
                        <up-icon name="arrow-right" size="14" color="#ccc"></up-icon>
                    </view>
                </view>

                <view class="action-btn">
                    <up-button text="保存修改" :loading="loading"
                        customStyle="height: 88rpx; background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%); color: #fff; font-size: 30rpx; font-weight: bold; border-radius: 44rpx; border: none; box-shadow: 0 8rpx 20rpx rgba(255, 71, 87, 0.3);"
                        @click="handleSave"></up-button>
                </view>

                <view class="logout-section">
                    <up-button text="退出登录" plain
                        customStyle="height: 80rpx; border-radius: 40rpx; font-size: 28rpx; color: #999; border-color: #eee;"
                        @click="openModal('logout')"></up-button>
                </view>
            </view>
        </view>

        <!-- Mobile Binding Modal -->
        <up-modal :show="modal.show && modal.type === 'mobile'" title="绑定手机号" showCancelButton confirmColor="#ff4757"
            cancelColor="#999" @confirm="handleBindMobile" @cancel="closeModal">
            <view class="modal-form" v-if="modal.show && modal.type === 'mobile'">
                <view class="modal-input-item">
                    <up-icon name="phone" size="18" color="#ff4757"></up-icon>
                    <input class="modal-input" type="number" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
                </view>
                <view class="modal-input-item">
                    <up-icon name="lock" size="18" color="#ff4757"></up-icon>
                    <input class="modal-input" type="number" v-model="form.code" placeholder="动态验证码" maxlength="6" />
                    <text class="get-code" :class="{ disabled: countdown > 0 }" @click="handleSendSms('BIND')">
                        {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
                    </text>
                </view>
            </view>
        </up-modal>

        <!-- Password Reset Modal -->
        <up-modal :show="modal.show && modal.type === 'password'" title="修改登录密码" showCancelButton confirmColor="#ff4757"
            cancelColor="#999" @confirm="handleResetPassword" @cancel="closeModal">
            <view class="modal-form" v-if="modal.show && modal.type === 'password'">
                <view class="modal-input-item">
                    <up-icon name="phone" size="18" color="#ff4757"></up-icon>
                    <input class="modal-input" type="number" v-model="form.phone" placeholder="已绑定手机号" maxlength="11" />
                </view>
                <view class="modal-input-item">
                    <up-icon name="lock" size="18" color="#ff4757"></up-icon>
                    <input class="modal-input" type="number" v-model="form.code" placeholder="动态验证码" maxlength="6" />
                    <text class="get-code" :class="{ disabled: countdown > 0 }" @click="handleSendSms('RESET_PWD')">
                        {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
                    </text>
                </view>
                <view class="modal-input-item">
                    <up-icon name="eye" size="18" color="#ff4757"></up-icon>
                    <input class="modal-input" type="password" v-model="form.password" placeholder="设置新密码" />
                </view>
            </view>
        </up-modal>

        <!-- Logout Modal -->
        <up-modal :show="modal.show && modal.type === 'logout'" title="提示" showCancelButton confirmColor="#ff4757"
            cancelColor="#999" @confirm="handleLogout" @cancel="closeModal">
            <view class="modal-content" v-if="modal.show && modal.type === 'logout'">确定退出登录吗？</view>
        </up-modal>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import config from '@/utils/config';
import { updateUserInfo, sendSms, bindMobile, resetPassword } from '@/api/user';

const userId = uni.getStorageSync('userId');
const userInfo = ref<any>({});
const loading = ref(false);
const baseUrl = config.baseUrl;

const modal = reactive({
    show: false,
    type: '' as 'mobile' | 'password' | 'logout' | ''
});

const form = reactive({
    phone: '',
    code: '',
    password: ''
});

const countdown = ref(0);
let timer: any = null;

const loadUserInfo = () => {
    if (!userId) return;
    request({
        url: '/user/info',
        method: 'GET',
        params: { userId }
    }).then((res: any) => {
        if (res.code === 200 && res.data) {
            userInfo.value = res.data || {};
            // 更新本地缓存
            uni.setStorageSync('userInfo', res.data);
            // Sync phone for reset password convenience
            if (userInfo.value.phone) {
                form.phone = userInfo.value.phone;
            }
        }
    });
};

const handleUploadAvatar = () => {
    uni.chooseImage({
        count: 1,
        success: (chooseImageRes) => {
            const tempFilePaths = chooseImageRes.tempFilePaths;
            uni.showLoading({ title: '上传中...' });

            uni.uploadFile({
                url: baseUrl + '/upload/image',
                filePath: tempFilePaths[0],
                name: 'file',
                success: (uploadFileRes) => {
                    const data = JSON.parse(uploadFileRes.data);
                    if (data.code === 200) {
                        userInfo.value.avatar = data.data;
                        // 立即更新本地缓存���确保返回时头像已更新
                        const cachedUserInfo = uni.getStorageSync('userInfo') || {};
                        cachedUserInfo.avatar = data.data;
                        uni.setStorageSync('userInfo', cachedUserInfo);
                        uni.showToast({ title: '上传成功', icon: 'success' });
                    } else {
                        uni.showToast({ title: '上传失败', icon: 'none' });
                    }
                },
                fail: () => {
                    uni.showToast({ title: '网络错误', icon: 'none' });
                },
                complete: () => {
                    uni.hideLoading();
                }
            });
        }
    });
};

const handleSave = () => {
    loading.value = true;
    updateUserInfo({
        id: userInfo.value.id,
        nickname: userInfo.value.nickname,
        avatar: userInfo.value.avatar
    }).then(() => {
        // 更新本地缓存
        uni.setStorageSync('userInfo', userInfo.value);
        uni.showToast({ title: '修改基本信息并保存成功', icon: 'success' });
        setTimeout(() => {
            loadUserInfo();
        }, 1000);
    }).finally(() => {
        loading.value = false;
    });
};

const openModal = (type: 'mobile' | 'password' | 'logout') => {
    modal.type = type;
    modal.show = true;
    form.code = '';
    form.password = '';
    if (type === 'mobile') {
        form.phone = ''; // Reset for binding new phone
    } else if (type === 'password') {
        form.phone = userInfo.value.phone || '';
    }
};

const closeModal = () => {
    modal.show = false;
};

const handleSendSms = (type: string) => {
    if (countdown.value > 0) return;
    if (!form.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' });
        return;
    }
    sendSms(form.phone, type).then(() => {
        uni.showToast({ title: '验证码已发送' });
        countdown.value = 60;
        timer = setInterval(() => {
            countdown.value--;
            if (countdown.value <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    });
};

const handleBindMobile = () => {
    if (!form.phone || !form.code) {
        uni.showToast({ title: '请填写完整', icon: 'none' });
        return;
    }
    bindMobile({
        userId,
        phone: form.phone,
        code: form.code
    }).then(() => {
        uni.showToast({ title: '手机号绑定成功', icon: 'success' });
        closeModal();
        loadUserInfo();
    });
};

const handleResetPassword = () => {
    if (!form.phone || !form.code || !form.password) {
        uni.showToast({ title: '请填写完整', icon: 'none' });
        return;
    }
    resetPassword({
        phone: form.phone,
        code: form.code,
        password: form.password
    }).then(() => {
        uni.showToast({ title: '密码修改成功', icon: 'success' });
        closeModal();
    });
};

const handleLogout = () => {
    uni.clearStorageSync();
    uni.reLaunch({ url: '/pages/login/login' });
};

onShow(() => {
    loadUserInfo();
});
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background-color: #f7f8fa;
    position: relative;
    padding-bottom: 40rpx;
}

.bg-decor {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 400rpx;
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;
    z-index: 0;
}

.content-wrapper {
    position: relative;
    z-index: 1;
    padding: 0 32rpx;
    margin-top: 40rpx;
}

.card {
    background: #fff;
    border-radius: 32rpx;
    padding: 50rpx 40rpx;
    box-shadow: 0 16rpx 40rpx rgba(255, 71, 87, 0.08);
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 60rpx;

    .avatar-box {
        position: relative;
        width: 160rpx;
        height: 160rpx;
        border-radius: 50%;
        border: 4rpx solid #fff;
        box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);

        .avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
        }

        .edit-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 44rpx;
            height: 44rpx;
            background: #ff4757;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2rpx solid #fff;
        }
    }

    .tip {
        margin-top: 16rpx;
        font-size: 24rpx;
        color: #999;
    }
}

.form-group {
    margin-bottom: 60rpx;

    .form-item {
        display: flex;
        align-items: center;
        padding: 30rpx 0;
        border-bottom: 1rpx solid #f5f5f5;

        &:last-child {
            border-bottom: none;
        }

        .label {
            width: 140rpx;
            font-size: 30rpx;
            color: #333;
            font-weight: bold;
        }

        .input {
            flex: 1;
            font-size: 30rpx;
            color: #333;
            text-align: right;
            margin-right: 20rpx;
        }

        .value {
            flex: 1;
            font-size: 30rpx;
            color: #666;
            text-align: right;
            margin-right: 20rpx;
        }

        .placeholder {
            color: #ccc;
        }
    }
}

.action-btn {
    margin-bottom: 40rpx;
}

.logout-section {
    padding-top: 20rpx;
    border-top: 1rpx solid #f5f5f5;
}

.modal-form {
    padding: 20rpx 0;

    .modal-input-item {
        display: flex;
        align-items: center;
        padding: 24rpx 0;
        border-bottom: 1rpx solid #eee;

        .modal-input {
            flex: 1;
            margin-left: 20rpx;
            font-size: 28rpx;
            color: #333;
        }

        .get-code {
            font-size: 26rpx;
            color: #ff4757;
            padding: 10rpx 20rpx;

            &.disabled {
                color: #ccc;
            }
        }
    }
}

/* Force override uview-plus modal confirm button color - Removed conflicting color override */
:deep(.u-modal__button-group__wrapper__text) {
    span {
        // Use default behavior from props
    }
}

.modal-content {
    padding: 40rpx 0;
    text-align: center;
    color: #606266;
    font-size: 30rpx;
}
</style>
