<template>
    <view class="container">
        <!-- Poster Card (The part to capture) -->
        <view class="poster-container">
            <view class="promo-card" id="poster">
                <image src="/static/share_bg_1.png" mode="aspectFill" class="bg-layer"></image>

                <view class="content-overlay">
                    <!-- Top Heading -->
                    <view class="header-section">
                        <text class="main-title">好运来</text>
                        <view class="banner-ribbon">
                            <view class="banner-content">
                                <view class="diamond">财</view>
                                <view class="diamond">运</view>
                                <view class="diamond">满</view>
                                <view class="diamond">满</view>
                            </view>
                        </view>
                    </view>

                    <!-- QR Code and Tag Positioning -->
                    <view class="tag-work-area">
                        <view class="amulet-content">
                            <text class="year-text">2026</text>
                            <view class="qr-box">
                                <image :src="qrImg" mode="aspectFit" class="qr-img" v-if="qrImg"></image>
                                <view v-else class="loading-qr">
                                    <up-loading-icon mode="circle"></up-loading-icon>
                                </view>
                            </view>
                            <text class="scan-tip-text">扫码查看</text>
                        </view>
                    </view>

                    <!-- Footer Section -->
                    <view class="footer-section">
                        <view class="brand-circles">
                            <view class="circle">爆</view>
                            <view class="circle">料</view>
                            <view class="circle">平</view>
                            <view class="circle">台</view>
                        </view>
                        <text class="bottom-slogan">万象更新 好运来临</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- Simplified Action Bar -->
        <view class="action-card">
            <up-button class="btn-gen" text="生成推广海报" @click="generatePoster"></up-button>
            <view class="sub-actions">
                <text class="refresh-btn" @click="updateQr">
                    <up-icon name="reload" size="14" color="#64748b" style="margin-right: 4rpx;"></up-icon>
                    更新二维码
                </text>
            </view>
            <view class="sub-tip">海报将包含品牌标识、您的专属邀请码及注册二维码业务</view>
        </view>

        <!-- Statistics Section -->
        <view class="stats-row">
            <view class="s-item">
                <text class="v">{{ stats.totalUsers || 0 }}</text>
                <text class="l">累计邀请</text>
            </view>
            <view class="s-item">
                <text class="v">{{ stats.todayRegCount || 0 }}</text>
                <text class="l">今日新增</text>
            </view>
        </view>

        <!-- Preview Modal -->
        <up-popup :show="showPreview" mode="center" @close="showPreview = false" bgColor="transparent">
            <view class="preview-wrap">
                <image :src="posterUrl" mode="widthFix" class="preview-img"></image>
                <view class="save-tip">
                    <text>长按图片保存到相册</text>
                </view>
                <view class="close-btn" @click="showPreview = false">
                    <up-icon name="close-circle" color="#fff" size="32"></up-icon>
                </view>
            </view>
        </up-popup>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '@/utils/request';
import config from '@/utils/config';
import html2canvas from 'html2canvas';

const domain = ref('');
const inviteCode = ref('');
const nickname = ref('');
const qrImg = ref('');
const stats = ref<any>({});
const showPreview = ref(false);
const posterUrl = ref('');

const cleanDomain = computed(() => {
    let d = domain.value.replace(/^https?:\/\//, '');
    if (d.endsWith(':80')) d = d.substring(0, d.length - 3);
    if (d.endsWith(':443')) d = d.substring(0, d.length - 4);
    if (d.endsWith('/')) d = d.substring(0, d.length - 1);
    return d;
});

const promoUrl = computed(() => {
    const protocol = domain.value.startsWith('http') ? '' : 'http://';
    // Point to landing/index instead of register page
    return `${protocol}${domain.value}/?code=${inviteCode.value}`;
});

onLoad(() => {
    fetchUserInfo();
    detectDomain();
    fetchStats();
});

const fetchUserInfo = () => {
    request({ url: '/user/info' }).then((res: any) => {
        inviteCode.value = res.data.username;
        nickname.value = res.data.nickname || res.data.username;
        updateQr();
    });
};

const detectDomain = () => {
    // #ifdef H5
    const origin = window.location.origin;
    domain.value = origin.replace(/^https?:\/\//, '');
    // #endif
};

const fetchStats = () => {
    request({ url: '/stats/summary' }).then((res: any) => {
        stats.value = res.data || {};
    });
};

const updateQr = () => {
    uni.showLoading({ title: '生成二维码...' });
    request({
        url: '/share/generate',
        params: { inviteCode: inviteCode.value, domain: domain.value || cleanDomain.value }
    }).then((res: any) => {
        qrImg.value = config.baseUrl + res.data;
        uni.hideLoading();
    });
};

const handleCopy = () => {
    uni.setClipboardData({
        data: promoUrl.value,
        success: () => uni.showToast({ title: '链接已复制' })
    });
};

const generatePoster = () => {
    uni.showLoading({ title: '生成海报中...' });
    const dom = document.querySelector('#poster') as HTMLElement;
    if (!dom) return;

    html2canvas(dom, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
    }).then(canvas => {
        posterUrl.value = canvas.toDataURL('image/png');
        showPreview.value = true;
        uni.hideLoading();
    }).catch(err => {
        console.error(err);
        uni.hideLoading();
        uni.showToast({ title: '生成失败', icon: 'none' });
    });
};
</script>

<style lang="scss" scoped>
.container {
    background: #f1f5f9;
    min-height: 100vh;
    padding: 30rpx;
}

.poster-container {
    display: flex;
    justify-content: center;
    margin-bottom: 40rpx;
}

.promo-card {
    position: relative;
    width: 600rpx;
    height: 1060rpx;
    background: #fff;
    border-radius: 40rpx;
    overflow: hidden;
    box-shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.1);

    .bg-layer {
        width: 100%;
        height: 100%;
        display: block;
    }

    .content-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10;
    }

    .header-section {
        margin-top: 60rpx;
        text-align: center;
        z-index: 20;

        .main-title {
            font-size: 110rpx;
            font-weight: 950;
            color: #000;
            -webkit-text-stroke: 4rpx #fff;
            filter: drop-shadow(0 6rpx 2rpx rgba(0, 0, 0, 0.6));
            letter-spacing: 12rpx;
            font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
            display: block;
            margin-bottom: 10rpx;
        }

        .banner-ribbon {
            position: relative;
            display: flex;
            justify-content: center;
            margin-top: 10rpx;

            .banner-content {
                background: linear-gradient(180deg, #b22222 0%, #8b0000 100%);
                border: 2rpx solid #ffd700;
                padding: 12rpx 40rpx;
                border-radius: 60rpx; // Curved look without image
                display: flex;
                gap: 15rpx;
                box-shadow: 0 6rpx 0 #5c0000;
                position: relative;

                &::before,
                &::after {
                    content: '';
                    position: absolute;
                    top: 10rpx;
                    width: 40rpx;
                    height: 60rpx;
                    background: #8b0000;
                    z-index: -1;
                }

                &::before {
                    left: -20rpx;
                    transform: skewY(15deg);
                }

                &::after {
                    right: -20rpx;
                    transform: skewY(-15deg);
                }
            }

            .diamond {
                width: 40rpx;
                height: 40rpx;
                background: #d32f2f;
                color: #fff;
                font-size: 28rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1rpx solid #ffca28;
                font-weight: 900;
                box-shadow: 2rpx 2rpx 0 rgba(0, 0, 0, 0.3);
            }
        }
    }

    .tag-work-area {
        position: absolute;
        // In share_bg_1.png, the amulet starts a bit higher
        top: 360rpx;
        width: 100%;
        display: flex;
        justify-content: center;

        .amulet-content {
            display: flex;
            flex-direction: column;
            align-items: center;

            .year-text {
                font-size: 22rpx;
                color: #333;
                font-weight: bold;
                margin-bottom: 4rpx;
            }

            .qr-box {
                width: 160rpx;
                height: 160rpx;
                background: #fff;
                padding: 4rpx;
                border: 1rpx solid #eee;

                .qr-img {
                    width: 100%;
                    height: 100%;
                }
            }

            .scan-tip-text {
                font-size: 28rpx;
                font-weight: 950;
                color: #000;
                font-family: 'Kaiti', 'STKaiti', serif;
                letter-spacing: 2rpx;
            }
        }
    }

    .footer-section {
        position: absolute;
        bottom: 60rpx;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;

        .brand-circles {
            display: flex;
            gap: 20rpx;
            margin-bottom: 20rpx;

            .circle {
                width: 64rpx;
                height: 64rpx;
                background: #fff;
                color: #000;
                border: 3rpx solid #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36rpx;
                font-weight: 950;
                box-shadow: 0 4rpx 0 #000;
            }
        }

        .bottom-slogan {
            font-size: 32rpx;
            font-weight: 950;
            color: #000;
            letter-spacing: 6rpx;
        }
    }
}

.action-card {
    background: #fff;
    border-radius: 30rpx;
    padding: 50rpx 40rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);
    margin-bottom: 30rpx;
    text-align: center;

    .btn-gen {
        height: 94rpx;
        border-radius: 47rpx;
        background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%) !important;
        color: #fff !important;
        font-weight: bold;
        border: none;
        box-shadow: 0 10rpx 20rpx rgba(255, 71, 87, 0.2);
    }

    .sub-actions {
        margin-top: 30rpx;
        display: flex;
        justify-content: center;

        .refresh-btn {
            font-size: 24rpx;
            color: #64748b;
            display: flex;
            align-items: center;
            background: #f1f5f9;
            padding: 8rpx 24rpx;
            border-radius: 30rpx;
            transition: all 0.2s;

            &:active {
                opacity: 0.7;
                transform: scale(0.95);
            }
        }
    }

    .sub-tip {
        font-size: 22rpx;
        color: #94a3b8;
        margin-top: 30rpx;
    }
}

.stats-row {
    display: flex;
    gap: 20rpx;

    .s-item {
        flex: 1;
        background: #fff;
        border-radius: 24rpx;
        padding: 30rpx;
        display: flex;
        flex-direction: column;
        align-items: center;

        .v {
            font-size: 36rpx;
            font-weight: 800;
            color: #1e293b;
        }

        .l {
            font-size: 22rpx;
            color: #94a3b8;
            margin-top: 8rpx;
        }
    }
}

.preview-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;

    .preview-img {
        width: 600rpx;
        border-radius: 30rpx;
        box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
    }

    .save-tip {
        margin-top: 30rpx;
        background: rgba(0, 0, 0, 0.6);
        padding: 12rpx 40rpx;
        border-radius: 40rpx;

        text {
            color: #fff;
            font-size: 26rpx;
        }
    }

    .close-btn {
        margin-top: 40rpx;
    }
}
</style>
