<template>
    <view class="container">
        <view class="header-bg">
            <text class="header-title">服务条款</text>
        </view>

        <view class="content-area">
            <view class="section">
                <text class="section-title">一、服务说明</text>
                <text class="section-text">本平台提供的所有付费内容均为电子虚拟商品，包括但不限于专家分析、预测数据、研究报告等。所有内容仅供参考，不构成任何投资建议或承诺。</text>
            </view>

            <view class="section">
                <text class="section-title">二、退款政策</text>
                <text class="section-text">付费内容一经解锁，不支持退款。请您在购买前仔细阅读内容简介，确认后再进行购买操作。充值到账户余额的资金，在无特殊原因的情况下不予退款。</text>
            </view>

            <view class="section">
                <text class="section-title">三、免责声明</text>
                <text class="section-text">1. 平台内所有文字、图片等内容仅供参考，均为专家个人研究数据，不保证连续性，不做任何承诺。</text>
                <text class="section-text">2. 用户应自愿付费、谨慎下单，购买即视为接受本协议，本声明具有法律效力。</text>
                <text class="section-text">3. 因用户自身判断或操作产生的任何损失，平台不承担任何责任。</text>
            </view>

            <view class="section">
                <text class="section-title">四、安全提示</text>
                <text class="section-text">1. 平台不会主动添加用户好友，不提供任何违法服务。</text>
                <text class="section-text">2. 所有私下交易均非平台官方行为，请谨防上当受骗。</text>
                <text class="section-text">3. 如遇到冒充平台工作人员的情况，请立即联系客服举报。</text>
            </view>

            <view class="section">
                <text class="section-title">五、用户行为规范</text>
                <text class="section-text">1. 用户不得将平台付费内容进行转载、传播或二次销售。</text>
                <text class="section-text">2. 用户不得利用平台从事任何违法违规活动。</text>
                <text class="section-text">3. 违反以上规定的，平台有权终止服务并追究法律责任。</text>
            </view>

            <view class="section">
                <text class="section-title">六、协议生效</text>
                <text class="section-text">用户在平台进行注册、购买等操作即视为已阅读并同意本服务条款。平台保留对本条款的最终解释权，并有权根据需要对条款内容进行修改更新。</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.container {
    min-height: 100vh;
    background: #f7f8fa;
}

.header-bg {
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    padding: 60rpx 0 50rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;

    .header-title {
        font-size: 36rpx;
        color: #fff;
        font-weight: bold;
    }
}

.content-area {
    padding: 30rpx;
}

.section {
    background: #fff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);

    .section-title {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
    }

    .section-text {
        display: block;
        font-size: 26rpx;
        color: #666;
        line-height: 1.8;
        text-align: justify;
        margin-bottom: 12rpx;

        &:last-child {
            margin-bottom: 0;
        }
    }
}
</style>
