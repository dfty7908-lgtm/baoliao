<template>
    <view class="container">
        <!-- Header Background & Merchant Card -->
        <view class="header-section">
            <view class="merchant-card">
                <view class="merchant-info">
                    <up-avatar src="/static/logo.png" size="50" shape="square"
                        customStyle="border-radius: 10rpx; border: 2rpx solid rgba(255,255,255,0.3); flex-shrink: 0;"></up-avatar>
                    <view class="info-content">
                        <view class="name-row">
                            <text class="name">料王爆料平台</text>
                        </view>
                        <view class="desc">最专业的情报服务站</view>
                    </view>
                </view>

                <view class="action-row">
                    <view class="action-item" @click="handleAction('pub')">
                        <up-icon name="volume-fill" size="20" color="#ff5e3a"></up-icon>
                        <text>公众号</text>
                    </view>
                    <view class="divider"></view>
                    <view class="action-item" @click="handleAction('wx')">
                        <up-icon name="weixin-fill" size="20" color="#ff5e3a"></up-icon>
                        <text>微信</text>
                    </view>
                    <view class="divider"></view>
                    <view class="action-item" @click="handleAction('feedback')">
                        <up-icon name="edit-pen-fill" size="20" color="#ff5e3a"></up-icon>
                        <text>反馈</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- Main Content Area -->
        <view class="main-body">
            <!-- Announcements Notice Bar -->
            <view class="notice-wrap" v-if="announcements && announcements.length > 0">
                <up-notice-bar :text="announcementTexts" color="#ff4757" bgColor="#fff0f0" @click="handleNoticeClick"
                    url="/pages/content/announcement_list" moreIcon scrollable></up-notice-bar>
            </view>

            <!-- Search Bar -->
            <view class="search-wrap">
                <up-search v-model="searchKeyword" placeholder="🔍 搜索料神 / 文章内容" :showAction="false" shape="round"
                    bgColor="#fff" placeholderColor="#bbb" color="#333" :clearabled="true" height="72"
                    :inputStyle="{ fontSize: '28rpx', height: '72rpx', lineHeight: '72rpx' }" @search="handleSearch"
                    @clear="handleSearch"></up-search>
            </view>

            <!-- Filter Bar -->
            <view class="filter-dropdown-wrap">
                <up-dropdown ref="uDropdownRef" activeColor="#ff4757" :zIndex="10000">
                    <up-dropdown-item v-model="categoryValue" :title="categoryTitle" :options="categoryOptions"
                        @change="handleCategoryChange"></up-dropdown-item>
                    <up-dropdown-item v-model="sortValue" :title="sortTitle" :options="sortOptions"
                        @change="handleSortChange"></up-dropdown-item>
                </up-dropdown>
            </view>

            <!-- Content List -->
            <view class="content-list">
                <!-- Regular Cards -->
                <view v-for="(item, index) in list" :key="index" class="content-card" @click="goDetail(item.id)">
                    <!-- 公开三角标 左上角 -->
                    <view v-if="item.isPublic === 1" class="corner-badge left green">
                        <text class="corner-text">公开</text>
                    </view>
                    <!-- 置顶三角标 右上角 -->
                    <view v-if="item.isTop === 1" class="corner-badge right orange">
                        <text class="corner-text">置顶</text>
                    </view>
                    <view class="card-header">
                        <view class="title-wrap">
                            <text class="title">{{ item.title }}</text>
                            <text v-if="item.isWinner" class="win-fire">
                                {{ '🔥'.repeat(item.winStreak || 1) }}
                            </text>
                        </view>
                        <view class="price">¥{{ item.price }}</view>
                    </view>

                    <view class="card-tags" v-if="item.tags && item.tags.length > 0">
                        <up-tag v-for="(tag, tagIndex) in item.tags" :key="tagIndex" :text="tag"
                            :type="getTagType(tagIndex)" size="mini" plain></up-tag>
                    </view>

                    <view class="card-footer">
                        <view class="footer-left">
                            <text>发布时间</text>
                            <text class="time-label">{{ formatDate(item.createTime) }}</text>
                        </view>
                    </view>

                    <!-- 开奖结果标记 -->
                    <view class="stamp-mark" v-if="item.isWinner">
                        <view class="stamp-inner" :class="item.isWinner === 1 ? 'red' : 'black'">
                            <view class="stamp-text">{{ item.isWinner === 1 ? '红' : '黑' }}</view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 加载状态提示 -->
            <view class="load-status">
                <view v-if="isLoading" class="load-tip">
                    <up-loading-icon size="20" color="#999"></up-loading-icon>
                    <text class="load-text">加载中...</text>
                </view>
                <view v-else-if="isFinished && list.length > 0" class="load-tip">
                    <text class="load-text">— 已加载全部内容 —</text>
                </view>
                <view v-else-if="!isLoading && list.length === 0" class="load-tip">
                    <text class="load-text">暂无内容</text>
                </view>
            </view>
        </view>

        <!-- Pub Popup -->
        <!-- Pub Popup -->
        <up-popup :show="showPubPopup" @close="showPubPopup = false" mode="center" round="32">
            <view class="pub-card-popup">
                <view class="popup-header">
                    <up-icon name="volume-fill" color="#ff4757" size="24"></up-icon>
                    <text class="popup-title">{{ merchantInfo.officialAccount || '公众号' }}</text>
                </view>
                <view class="qr-container" @click="previewImage(merchantInfo.officialQrcode)">
                    <image :src="merchantInfo.officialQrcode" mode="aspectFit" class="qr-img"></image>
                    <view class="scan-tip">
                        <up-icon name="scan" color="#999" size="14"></up-icon>
                        <text>点击预览 / 长按识别</text>
                    </view>
                </view>
                <view class="popup-footer">
                    <text>最专业的情报服务平台</text>
                </view>
            </view>
        </up-popup>

        <!-- WeChat Popup -->
        <up-popup :show="showWxPopup" @close="showWxPopup = false" mode="center" round="32">
            <view class="pub-card-popup">
                <view class="popup-header">
                    <up-icon name="weixin-fill" color="#07c160" size="26"></up-icon>
                    <text class="popup-title">添加客服微信</text>
                </view>

                <view class="contact-row">
                    <text class="label">微信号：</text>
                    <text class="value">{{ merchantInfo.wechatAccount }}</text>
                    <view class="copy-btn" @click="copyText(merchantInfo.wechatAccount)">复制</view>
                </view>

                <view class="qr-container" @click="previewImage(merchantInfo.wechatQrcode)">
                    <image :src="merchantInfo.wechatQrcode" mode="aspectFit" class="qr-img"></image>
                    <view class="scan-tip">
                        <up-icon name="scan" color="#999" size="14"></up-icon>
                        <text>点击预览二维码</text>
                    </view>
                </view>
            </view>
        </up-popup>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const list = ref<any[]>([]);
const searchKeyword = ref('');
const categoryValue = ref('all');
const sortValue = ref('default');
const categoryTitle = ref('全部文章');
const sortTitle = ref('默认排序');

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(10);
const isLoading = ref(false);
const isFinished = ref(false);

// Announcements
const announcements = ref<any[]>([]);
const announcementTexts = ref<string>('');

const categoryOptions = [
    { label: '全部文章', value: '' },
    { label: '已上架', value: 'all' },
    { label: '已公开', value: 'public' }
];

const sortOptions = [
    { label: '默认排序', value: 'default' },
    { label: '价格从高到低', value: 'price_desc' },
    { label: '价格从低到高', value: 'price_asc' }
];

const merchantInfo = ref({
    name: '料王爆料平台',
    desc: '最专业的情报服务站',
    officialAccount: '',
    wechatAccount: '',
    officialQrcode: '',
    wechatQrcode: ''
});

const showPubPopup = ref(false);
const showWxPopup = ref(false);

const formatDate = (timeStr: string) => {
    if (!timeStr) return '刚刚';
    // Handle '2026-02-08T20:57:03' -> '2026-02-08 20:57'
    try {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr; // Return original if invalid

        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const hh = date.getHours().toString().padStart(2, '0');
        const mm = date.getMinutes().toString().padStart(2, '0');
        return `${y}-${m}-${d} ${hh}:${mm}`;
    } catch (e) {
        return timeStr;
    }
};

const parseItem = (i: any) => {
    let tags: any[] = [];
    if (i.tags) {
        try {
            tags = typeof i.tags === 'string' ? JSON.parse(i.tags) : i.tags;
            if (!Array.isArray(tags)) tags = [];
        } catch (e) {
            console.error('Failed to parse tags:', e);
            tags = [];
        }
    }
    return { ...i, tags };
};

// 加载数据（支持分页追加）
const loadData = (isLoadMore = false) => {
    if (isLoading.value) return;
    if (isLoadMore && isFinished.value) return;

    isLoading.value = true;

    if (!isLoadMore) {
        // 重置分页状态
        currentPage.value = 1;
        isFinished.value = false;
    }

    const params: any = {
        page: currentPage.value,
        size: pageSize.value,
        keyword: searchKeyword.value,
        category: categoryValue.value,
        sort: sortValue.value !== 'default' ? sortValue.value : '',
        isAnnouncement: 0
    };

    request({
        url: '/content/list',
        data: params
    }).then((res: any) => {
        const records = res.data.records || [];
        const total = res.data.total || 0;
        const parsed = records.map(parseItem);

        if (isLoadMore) {
            // 追加数据
            list.value = [...list.value, ...parsed];
        } else {
            // 首次加载或刷新，替换数据
            list.value = parsed;
        }

        // 判断是否已加载全部
        if (list.value.length >= total || records.length < pageSize.value) {
            isFinished.value = true;
        }
    }).finally(() => {
        isLoading.value = false;
    });

    if (!isLoadMore) {
        loadSystemConfig();
        loadAnnouncements();
    }
};

const loadAnnouncements = () => {
    request({
        url: '/announcement/list'
    }).then((res: any) => {
        announcements.value = (res.data || []).slice(0, 5); // Show latest 5
        const texts = announcements.value.map(i => {
            // Strip HTML and &nbsp;
            return (i.content || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
        });
        announcementTexts.value = texts.join('   |   ');
    });
};

const loadSystemConfig = () => {
    request({
        url: '/config/list'
    }).then((res: any) => {
        const configMap: any = {};
        res.data.forEach((item: any) => {
            configMap[item.configKey] = item.configValue;
        });

        merchantInfo.value = {
            ...merchantInfo.value,
            officialAccount: configMap['contact_official_account'] || '料王专业大数据',
            wechatAccount: configMap['contact_wechat_id'] || 'LW_SERVICE_88',
            officialQrcode: configMap['contact_official_qrcode'] || '/static/logo.png',
            wechatQrcode: configMap['contact_wechat_qrcode'] || '/static/logo.png'
        };
    });
};


const handleSearch = () => {
    loadData(false);
};

const handleCategoryChange = (val: string) => {
    const option = categoryOptions.find(o => o.value === val);
    categoryTitle.value = option ? option.label : '全部文章';
    loadData(false);
};

const handleSortChange = (val: string) => {
    const option = sortOptions.find(o => o.value === val);
    sortTitle.value = option ? option.label : '默认排序';
    loadData(false);
};

// 触底加载更多
onReachBottom(() => {
    if (!isFinished.value && !isLoading.value) {
        currentPage.value++;
        loadData(true);
    }
});

// 下拉刷新
onPullDownRefresh(() => {
    loadData(false);
    // isLoading 状态变化后自动停止刷新动画
    const timer = setInterval(() => {
        if (!isLoading.value) {
            clearInterval(timer);
            uni.stopPullDownRefresh();
        }
    }, 200);
});

const previewImage = (url: string) => {
    if (!url) return;
    uni.previewImage({
        urls: [url]
    });
};

const getTagType = (index: number) => {
    const types = ['error', 'primary', 'success'];
    return types[index % types.length];
};

const handleAction = (type: string) => {
    if (type === 'feedback') {
        uni.navigateTo({ url: '/pages/user/feedback' });
        return;
    }

    if (type === 'pub') {
        showPubPopup.value = true;
        return;
    }

    if (type === 'wx') {
        showWxPopup.value = true;
        return;
    }

    const title = '联系客服';
    const content = `请添加微信客服: ${merchantInfo.value.wechatAccount || 'bl_service_01'}`;

    uni.showModal({
        title,
        content,
        showCancel: false,
        confirmColor: '#ff4757'
    });
};

const copyText = (content: string) => {
    uni.setClipboardData({
        data: content,
        success: () => uni.showToast({ title: '已复制' })
    });
};

const goDetail = (id: number) => {
    uni.navigateTo({ url: `/pages/content/detail?id=${id}` });
};

const handleNoticeClick = (index: number) => {
    const item = announcements.value[index];
    if (item) {
        uni.navigateTo({ url: `/pages/content/announcement?id=${item.id}` });
    }
};

onShow(() => {
    loadData(false);
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
    background-color: #f7f8fa;
}

.header-section {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    padding: 32rpx 32rpx 120rpx; // Added top padding instead of navbar
    display: flex;
    flex-direction: column;
    border-bottom-left-radius: 48rpx;
    border-bottom-right-radius: 48rpx;
}

.merchant-card {
    box-sizing: border-box; // Fix overflow
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);

    .merchant-info {
        display: flex;
        align-items: center;
        margin-bottom: 24rpx;

        .info-content {
            flex: 1;
            margin-left: 20rpx;
            overflow: hidden;

            .name-row {
                display: flex;
                align-items: center;
                margin-bottom: 6rpx;

                .name {
                    font-size: 32rpx;
                    font-weight: 700;
                    color: #333;
                }

                .switch-btn {
                    margin-left: 16rpx;
                    background: #fff0f0;
                    color: #ff4757;
                    font-size: 20rpx;
                    padding: 2rpx 10rpx;
                    border-radius: 6rpx;
                    border: 1px solid rgba(255, 71, 87, 0.2);
                }
            }

            .desc {
                font-size: 24rpx;
                color: #999;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }

    .action-row {
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding-top: 20rpx;
        border-top: 1px solid #f5f5f5;

        .action-item {
            display: flex;
            align-items: center;
            font-size: 26rpx;
            color: #666;

            text {
                margin-left: 8rpx;
            }
        }

        .divider {
            width: 1px;
            height: 24rpx;
            background-color: #eee;
        }
    }
}

.main-body {
    margin-top: -60rpx;
    padding: 0 32rpx 40rpx;
    position: relative;
    z-index: 10;
}

.notice-wrap {
    margin-bottom: 24rpx;
    border-radius: 12rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
}

.search-wrap {
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
    border-radius: 100rpx;
    overflow: hidden;
    margin-left: 12rpx; // Visual balance
    margin-right: 12rpx; // Visual balance
}

.filter-dropdown-wrap {
    background: #fff;
    margin-bottom: 24rpx;
    border-radius: 12rpx;
    // overflow: hidden; // Removed to allow dropdown execution
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
    position: relative;
    z-index: 10000; // Ensure it is above all content
}

.content-list {
    padding-bottom: 40rpx;
}

.load-status {
    padding: 30rpx 0 60rpx;
    text-align: center;

    .load-tip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10rpx;
    }

    .load-text {
        font-size: 26rpx;
        color: #ccc;
    }
}

.content-card {
    position: relative;
    background: #fff;
    border-radius: 20rpx;
    padding: 34rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);
    border: 1rpx solid #efefef;
    overflow: hidden;

    &.announcement {
        border-color: #e6f7ff;

        .title {
            color: #333;
        }
    }

    .corner-badge {
        position: absolute;
        width: 0;
        height: 0;
        z-index: 5;

        &.left {
            top: 0;
            left: 0;
            border-top: 70rpx solid;
            border-right: 70rpx solid transparent;

            .corner-text {
                position: absolute;
                top: -62rpx;
                left: 4rpx;
                transform: rotate(-45deg);
                transform-origin: center;
            }
        }

        &.right {
            top: 0;
            right: 0;
            border-top: 70rpx solid;
            border-left: 70rpx solid transparent;

            .corner-text {
                position: absolute;
                top: -62rpx;
                right: 4rpx;
                transform: rotate(45deg);
                transform-origin: center;
            }
        }

        &.green {
            border-top-color: #52c41a;
        }

        &.orange {
            border-top-color: #ff8c42;
        }

        .corner-text {
            font-size: 18rpx;
            color: #fff;
            font-weight: bold;
            white-space: nowrap;
        }
    }

    .badge-notice {
        position: absolute;
        top: 0;
        left: 0;
        background: #52c41a;
        color: #fff;
        font-size: 18rpx;
        padding: 4rpx 14rpx;
        border-bottom-right-radius: 12rpx;
        z-index: 5;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20rpx;

        .title-wrap {
            flex: 1;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            margin-right: 16rpx; // Spacing from price

            .title {
                font-size: 32rpx;
                color: #222;
                font-weight: 800;
                line-height: 1.4;
                // Allow wrapping but respect container
            }

            .win-fire {
                margin-left: 8rpx;
                font-size: 24rpx;
            }
        }

        .price {
            font-size: 36rpx;
            color: #ff4757;
            font-weight: 800;
            // margin-left: 20rpx; // Handled by title-wrap margin-right for safety
            flex-shrink: 0; // Prevent price from squishing
            white-space: nowrap;
        }
    }

    .card-tags {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 24rpx;
    }

    .card-footer {
        padding-top: 20rpx;
        border-top: 1rpx solid #f8f8f8;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 24rpx;
        color: #999;

        .footer-left {
            display: flex;
            align-items: center;

            text {
                margin-right: 8rpx;
            }
        }
    }

    .stamp-mark {
        position: absolute;
        right: 24rpx;
        bottom: 24rpx;
        z-index: 10;
        transform: rotate(15deg);
        opacity: 0.9;

        .stamp-inner {
            width: 70rpx;
            height: 70rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3rpx solid;
            position: relative;

            &::after {
                content: '';
                position: absolute;
                top: 4rpx;
                left: 4rpx;
                right: 4rpx;
                bottom: 4rpx;
                border: 1.5rpx dashed;
                border-radius: 50%;
            }

            .stamp-text {
                font-size: 28rpx;
                font-weight: bold;
            }

            &.red {
                color: #ff4757;
                border-color: rgba(255, 71, 87, 0.4);

                &::after {
                    border-color: rgba(255, 71, 87, 0.3);
                }
            }

            &.black {
                color: #999;
                border-color: rgba(153, 153, 153, 0.4);

                &::after {
                    border-color: rgba(153, 153, 153, 0.3);
                }
            }
        }
    }
}
</style>

<style lang="scss" scoped>
.pub-card-popup {
    width: 580rpx;
    background: #fff;
    padding: 40rpx 50rpx 50rpx;
    border-radius: 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .popup-header {
        display: flex;
        align-items: center;
        margin-bottom: 40rpx;
        gap: 12rpx;

        .popup-title {
            font-size: 34rpx;
            font-weight: 800;
            color: #333;
        }
    }

    .contact-row {
        width: 100%;
        background: #f8fafc;
        padding: 20rpx 24rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 40rpx;
        border: 1rpx solid #e2e8f0;

        .label {
            font-size: 26rpx;
            color: #64748b;
        }

        .value {
            font-size: 30rpx;
            font-weight: bold;
            color: #333;
            margin: 0 16rpx;
        }

        .copy-btn {
            font-size: 22rpx;
            color: #fff;
            background: #ff4757;
            padding: 4rpx 16rpx;
            border-radius: 20rpx;
        }
    }

    .qr-container {
        width: 400rpx;
        height: 400rpx;
        background: #fff;
        border-radius: 20rpx;
        padding: 20rpx;
        box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
        border: 1rpx solid #f1f5f9;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .qr-img {
            width: 320rpx;
            height: 320rpx;
        }

        .scan-tip {
            margin-top: 10rpx;
            display: flex;
            align-items: center;
            gap: 6rpx;

            text {
                font-size: 20rpx;
                color: #94a3b8;
            }
        }
    }

    .popup-footer {
        margin-top: 30rpx;
        font-size: 22rpx;
        color: #cbd5e1;
        letter-spacing: 2rpx;
    }
}
</style>
