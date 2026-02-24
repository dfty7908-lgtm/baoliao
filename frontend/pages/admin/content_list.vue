<template>
    <view class="container">
        <!-- 系列筛选栏 -->
        <scroll-view scroll-x class="series-tabs">
            <view class="tab-item" :class="{ active: !currentSeriesId }" @click="filterBySeries(null)">
                <text>全部</text>
            </view>
            <view class="tab-item" v-for="s in seriesList" :key="s.id" :class="{ active: currentSeriesId === s.id }"
                @click="filterBySeries(s.id)">
                <text>{{ s.name }}</text>
            </view>
        </scroll-view>

        <!-- 组合筛选 -->
        <view class="filter-container">
            <!-- 购买状态筛选 -->
            <view class="filter-row">
                <text class="filter-label">购买:</text>
                <view class="filter-options">
                    <text class="option" :class="{ active: !purchaseFilter }" @click="filterByPurchase('')">全部</text>
                    <text class="option" :class="{ active: purchaseFilter === 'purchased' }"
                        @click="filterByPurchase('purchased')">已购买</text>
                    <text class="option" :class="{ active: purchaseFilter === 'unpurchased' }"
                        @click="filterByPurchase('unpurchased')">未购买</text>
                </view>
            </view>

            <!-- 状态筛选 -->
            <view class="filter-row">
                <text class="filter-label">状态:</text>
                <view class="filter-options">
                    <text class="option" :class="{ active: shelvedFilter === null }"
                        @click="filterByShelved(null)">全部</text>
                    <text class="option" :class="{ active: shelvedFilter === 1 }" @click="filterByShelved(1)">已上架</text>
                    <text class="option" :class="{ active: shelvedFilter === 0 }" @click="filterByShelved(0)">已下架</text>
                </view>
            </view>

            <!-- 开奖筛选 -->
            <view class="filter-row">
                <text class="filter-label">开奖:</text>
                <view class="filter-options">
                    <text class="option" :class="{ active: winnerFilter === null }"
                        @click="filterByWinner(null)">全部</text>
                    <text class="option" :class="{ active: winnerFilter === 0 }" @click="filterByWinner(0)">未开奖</text>
                    <text class="option" :class="{ active: winnerFilter === 1 }" @click="filterByWinner(1)">已中奖</text>
                    <text class="option" :class="{ active: winnerFilter === 2 }" @click="filterByWinner(2)">未中奖</text>
                </view>
            </view>
        </view>

        <view class="search-wrap">
            <up-search v-model="keyword" placeholder="搜索标题..." :showAction="true" actionText="发布" @search="resetList"
                @clear="resetList" @custom="navToPublish" searchIconColor="#ff4757"
                :actionStyle="{ color: '#ff4757', fontWeight: 'bold' }"></up-search>
        </view>

        <view class="list">
            <view class="item-card" :class="{ 'has-purchase': item.purchaseCount > 0 }" v-for="item in list"
                :key="item.id">
                <view class="header-row">
                    <view class="title-wrap">
                        <text class="title">{{ item.title }}</text>
                        <view class="period-tag" v-if="item.periodNumber">
                            <text>第{{ String(item.periodNumber).padStart(3, '0') }}期</text>
                        </view>
                    </view>
                    <view class="price-wrap">
                        <text class="price">¥{{ item.price }}</text>
                        <view class="stats-row">
                            <text class="views">{{ item.views || 0 }} 浏览</text>
                            <text class="purchase-count" v-if="item.purchaseCount > 0">{{ item.purchaseCount }}
                                购买</text>
                        </view>
                    </view>
                </view>

                <view class="tags-row">
                    <view class="tag-item">
                        <up-tag :text="item.isShelved === 1 ? '已上架' : '已下架'"
                            :type="item.isShelved === 1 ? 'success' : 'info'" size="mini" plain
                            :customStyle="{ borderColor: item.isShelved === 1 ? '#37b24d' : '#eee', color: item.isShelved === 1 ? '#37b24d' : '#999' }">
                        </up-tag>
                    </view>
                    <view class="tag-item" v-if="item.isPublic === 1">
                        <up-tag text="免费预览" type="error" size="mini" plain
                            :customStyle="{ borderColor: '#ff4757', color: '#ff4757' }"></up-tag>
                    </view>
                    <view class="tag-item" v-if="item.isWinner === 1">
                        <up-tag text="中奖" type="warning" size="mini" plain
                            :customStyle="{ borderColor: '#fcc419', color: '#fcc419' }"></up-tag>
                    </view>
                    <view class="tag-item" v-if="item.isWinner === 2">
                        <up-tag text="未中" type="info" size="mini" plain
                            :customStyle="{ borderColor: '#999', color: '#999' }"></up-tag>
                    </view>
                </view>

                <view class="divider"></view>

                <view class="action-row">
                    <view class="left-group">
                        <text class="btn-text blue" @click="handleEdit(item.id)">编辑</text>
                        <block v-if="!item.isWinner || item.isWinner === 0">
                            <text class="btn-text red" @click="setWinnerStatus(item, 1)">设为中</text>
                            <text class="btn-text grey" style="color: #333;"
                                @click="setWinnerStatus(item, 2)">设为不中</text>
                        </block>
                        <block v-else>
                            <text class="btn-text grey" @click="setWinnerStatus(item, 0)">
                                {{ item.isWinner === 1 ? '取消中奖' : '取消不中' }}
                            </text>
                        </block>
                    </view>
                    <view class="right-group">
                        <text class="btn-text green" v-if="item.seriesId"
                            @click="publishNext(item.seriesId)">发下一期</text>
                        <text class="btn-text orange" @click="toggleShelf(item)">
                            {{ item.isShelved === 1 ? '下架' : '上架' }}
                        </text>
                        <text class="btn-text red" @click="confirmDelete(item.id)">删除</text>
                    </view>
                </view>
            </view>

            <up-loadmore :status="loadStatus" @loadmore="loadMore"></up-loadmore>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onReachBottom } from '@dcloudio/uni-app';
import { request } from '@/utils/request';

const list = ref<any[]>([]);
const keyword = ref('');
const page = ref(1);
const loadStatus = ref('loadmore');
const seriesList = ref<any[]>([]);
const currentSeriesId = ref<number | null>(null);
const purchaseFilter = ref('');
const winnerFilter = ref<number | null>(null);
const shelvedFilter = ref<number | null>(null);

onShow(() => {
    loadSeriesList();
    resetList();
});

onReachBottom(() => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadList();
    }
});

const loadSeriesList = () => {
    request({ url: '/series/list' }).then((res: any) => {
        seriesList.value = res.data || [];
    });
};

const filterBySeries = (seriesId: number | null) => {
    currentSeriesId.value = seriesId;
    resetList();
};

const filterByPurchase = (filter: string) => {
    purchaseFilter.value = filter;
    resetList();
};

const filterByWinner = (val: number | null) => {
    winnerFilter.value = val;
    resetList();
};

const filterByShelved = (val: number | null) => {
    shelvedFilter.value = val;
    resetList();
};

const resetList = () => {
    page.value = 1;
    list.value = [];
    loadList();
};

const loadList = () => {
    loadStatus.value = 'loading';
    const data: any = {
        page: page.value,
        size: 10,
        keyword: keyword.value,
        isAdmin: true,
        isAnnouncement: 0
    };
    if (currentSeriesId.value) {
        data.seriesId = currentSeriesId.value;
    }
    if (purchaseFilter.value) {
        data.purchaseFilter = purchaseFilter.value;
    }
    if (winnerFilter.value !== null) {
        data.isWinner = winnerFilter.value;
    }
    if (shelvedFilter.value !== null) {
        data.isShelved = shelvedFilter.value;
    }
    request({
        url: '/content/list',
        data
    }).then((res: any) => {
        const records = res.data.records || [];
        list.value = [...list.value, ...records];
        loadStatus.value = records.length < 10 ? 'nomore' : 'loadmore';
    });
};

const loadMore = () => {
    if (loadStatus.value === 'loadmore') {
        page.value++;
        loadList();
    }
};

const handleEdit = (id: number) => {
    uni.navigateTo({ url: `/pages/admin/content_publish?id=${id}` });
};

const navToPublish = () => {
    uni.navigateTo({ url: '/pages/admin/content_publish' });
};

const publishNext = (seriesId: number) => {
    uni.navigateTo({ url: `/pages/admin/content_publish?seriesId=${seriesId}` });
};

const setWinnerStatus = (item: any, status: number) => {
    request({
        url: '/content/save',
        method: 'POST',
        data: { id: item.id, isWinner: status }
    }).then(() => {
        item.isWinner = status;
        let msg = '已重置';
        if (status === 1) msg = '已设为中奖';
        if (status === 2) msg = '已设为未中';
        uni.showToast({ title: msg, icon: 'none' });
    });
};

const toggleShelf = (item: any) => {
    const newStatus = item.isShelved === 1 ? 0 : 1;
    request({
        url: `/content/shelf?id=${item.id}&status=${newStatus}`,
        method: 'PUT'
    }).then(() => {
        item.isShelved = newStatus;
        uni.showToast({ title: '操作成功' });
    });
};

const confirmDelete = (id: number) => {
    uni.showModal({
        title: '提示',
        content: '确定要删除这篇文章吗？',
        confirmColor: '#ff4757',
        success: (res) => {
            if (res.confirm) {
                request({
                    url: `/content/admin/${id}`,
                    method: 'DELETE'
                }).then(() => {
                    uni.showToast({ title: '已删除' });
                    resetList();
                });
            }
        }
    });
};
</script>

<style lang="scss" scoped>
.container {
    background-color: #f7f8fa;
    min-height: 100vh;
    padding: 0 24rpx 24rpx;
}

.series-tabs {
    white-space: nowrap;
    padding: 24rpx 0 16rpx;

    .tab-item {
        display: inline-block;
        padding: 12rpx 28rpx;
        margin-right: 16rpx;
        border-radius: 30rpx;
        background: #fff;
        border: 1rpx solid #eee;

        text {
            font-size: 26rpx;
            color: #666;
        }

        &.active {
            background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
            border-color: transparent;

            text {
                color: #fff;
                font-weight: 500;
            }
        }
    }
}

.filter-container {
    background: #fff;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;

    .filter-row {
        display: flex;
        align-items: center;
        gap: 20rpx;

        .filter-label {
            font-size: 24rpx;
            color: #999;
            width: 70rpx;
        }

        .filter-options {
            flex: 1;
            display: flex;
            gap: 12rpx;
            flex-wrap: wrap;

            .option {
                font-size: 24rpx;
                color: #666;
                background: #f8f9fa;
                padding: 6rpx 20rpx;
                border-radius: 6rpx;
                border: 1rpx solid #eee;

                &.active {
                    background: #fff5f0;
                    border-color: #ff8c42;
                    color: #ff8c42;
                    font-weight: 500;
                }
            }
        }
    }
}

.search-wrap {
    margin-bottom: 24rpx;
}

.item-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);

    &.has-purchase {
        border-left: 6rpx solid #ff8c42;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16rpx;

        .title-wrap {
            flex: 1;
            margin-right: 20rpx;

            .title {
                font-size: 32rpx;
                font-weight: bold;
                color: #333;
                line-height: 1.4;
                display: block;
            }

            .period-tag {
                display: inline-block;
                margin-top: 8rpx;
                background: #f0f5ff;
                padding: 4rpx 16rpx;
                border-radius: 8rpx;

                text {
                    font-size: 22rpx;
                    color: #4e8df5;
                    font-weight: 500;
                }
            }
        }

        .price-wrap {
            display: flex;
            flex-direction: column;
            align-items: flex-end;

            .price {
                font-size: 32rpx;
                color: #ff4757;
                font-weight: bold;
                font-family: DIN, sans-serif;
            }

            .stats-row {
                display: flex;
                align-items: center;
                gap: 12rpx;
                margin-top: 4rpx;
            }

            .views {
                font-size: 22rpx;
                color: #999;
            }

            .purchase-count {
                font-size: 22rpx;
                color: #ff8c42;
                font-weight: 500;
            }
        }
    }

    .tags-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 24rpx;

        .tag-item {
            margin-right: 12rpx;
            margin-bottom: 12rpx;
        }
    }

    .divider {
        height: 1rpx;
        background: #f5f5f5;
        margin-bottom: 20rpx;
    }

    .action-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .left-group,
        .right-group {
            display: flex;
            align-items: center;
            gap: 20rpx;
        }

        .btn-text {
            font-size: 28rpx;
            padding: 10rpx 0;

            &.blue {
                color: #4e8df5;
            }

            &.red {
                color: #ff4757;
            }

            &.orange {
                color: #ff9f43;
            }

            &.grey {
                color: #666;
            }

            &.green {
                color: #37b24d;
            }
        }
    }
}
</style>
