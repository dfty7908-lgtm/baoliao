<template>
    <view class="container">
        <!-- Background Decor -->
        <view class="bg-decor"></view>

        <view class="content-wrapper">
            <view class="card">
                <view class="header">
                    <view class="icon-box">
                        <image src="/static/logo.png" mode="aspectFit" class="logo-img"></image>
                    </view>
                    <view class="title">隐私政策</view>
                    <view class="subtitle">最后更新日期：2026年02月08日</view>
                </view>

                <view class="policy-content">
                    <view class="section">
                        <view class="section-title">
                            <text class="num">01</text>
                            <text>信息收集范围</text>
                        </view>
                        <view class="p">当您使用本平台服务时，我们可能收集：</view>
                        <view class="list">
                            <view class="item">1. 账号信息：手机号、邮箱、实名认证资料</view>
                            <view class="item">2. 交易信息：订单记录、支付凭证、发票信息</view>
                            <view class="item">3. 设备信息：IMEI、MAC地址、操作系统版本</view>
                            <view class="item">4. 行为数据：浏览记录、搜索关键词、点击行为</view>
                        </view>
                    </view>

                    <view class="section">
                        <view class="section-title">
                            <text class="num">02</text>
                            <text>信息使用方式</text>
                        </view>
                        <view class="p">我们仅在以下场景使用您的信息：</view>
                        <view class="list">
                            <view class="item">1. 账户管理与身份验证</view>
                            <view class="item">2. 商品/服务的交付与售后支持</view>
                            <view class="item">3. 平台功能优化与安全防护</view>
                            <view class="item">4. 合规性审计与法律程序响应</view>
                        </view>
                    </view>

                    <view class="section">
                        <view class="section-title">
                            <text class="num">03</text>
                            <text>数据共享原则</text>
                        </view>
                        <view class="p">未经您明确同意，我们不会向第三方共享个人信息，除以下情况：</view>
                        <view class="list">
                            <view class="item">1. 依法向监管部门提供必要数据</view>
                            <view class="item">2. 委托合作方处理订单（如物流公司）</view>
                            <view class="item">3. 企业并购等重大经营变更场景</view>
                            <view class="item">4. 经脱敏处理的统计分析数据</view>
                        </view>
                    </view>

                    <view class="section">
                        <view class="section-title">
                            <text class="num">04</text>
                            <text>用户权利保障</text>
                        </view>
                        <view class="p">您享有以下数据控制权：</view>
                        <view class="list">
                            <view class="item">1. 通过账户设置查看/修改个人信息</view>
                            <view class="item">2. 申请导出近一年的交易数据记录</view>
                            <view class="item">3. 注销账户并请求删除关联信息</view>
                            <view class="item">4. 通过service@yunhui.com提出投诉</view>
                        </view>
                    </view>

                    <view class="section">
                        <view class="section-title">
                            <text class="num">05</text>
                            <text>信息安全措施</text>
                        </view>
                        <view class="p">我们采取以下保护机制：</view>
                        <view class="list">
                            <view class="item">1. HTTPS加密传输关键数据</view>
                            <view class="item">2. 敏感信息加密存储于独立服务器</view>
                            <view class="item">3. 定期进行安全漏洞扫描</view>
                            <view class="item">4. 员工访问权限分级管控</view>
                        </view>
                    </view>

                    <view class="section">
                        <view class="section-title">
                            <text class="num">06</text>
                            <text>Cookie使用说明</text>
                        </view>
                        <view class="p">为提升服务体验，我们使用Cookie技术：</view>
                        <view class="list">
                            <view class="item">1. 会话Cookie维持登录状态（关闭浏览器自动清除）</view>
                            <view class="item">2. 持久Cookie记录语言偏好等设置（最长保留180天）</view>
                            <view class="item">3. 您可通过浏览器设置禁用Cookie，但可能影响部分功能</view>
                        </view>
                    </view>

                    <view class="section">
                        <view class="section-title">
                            <text class="num">07</text>
                            <text>未成年人保护</text>
                        </view>
                        <view class="list">
                            <view class="item">1. 未满14周岁的用户禁止独立使用本平台</view>
                            <view class="item">2. 14-18周岁用户需监护人同意后使用</view>
                            <view class="item">3. 发现未成年人注册将立即终止服务并删除数据</view>
                        </view>
                    </view>

                    <view class="section">
                        <view class="section-title">
                            <text class="num">08</text>
                            <text>协议更新机制</text>
                        </view>
                        <view class="list">
                            <view class="item">1. 重大变更将通过站内公告提前7日公示</view>
                            <view class="item">2. 您继续使用服务视为接受修订条款</view>
                            <view class="item">3. 如不同意请及时停止使用服务</view>
                        </view>
                    </view>
                </view>

                <view class="footer-copy">
                    <text>版权所有 © 2026 料王爆料平台 保留所有权利</text>
                </view>
            </view>
        </view>
    </view>
</template>

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
    height: 480rpx;
    background: linear-gradient(135deg, #ff8c42 0%, #ff4757 100%);
    border-bottom-left-radius: 48rpx;
    border-bottom-right-radius: 48rpx;
    z-index: 0;
}

.content-wrapper {
    position: relative;
    z-index: 1;
    padding: 0 32rpx;
    margin-top: 40rpx; // Clear navbar
}

.card {
    background: #fff;
    border-radius: 32rpx;
    padding: 50rpx 40rpx;
    box-shadow: 0 16rpx 40rpx rgba(255, 71, 87, 0.08);
    min-height: 800rpx;

    .header {
        text-align: center;
        margin-bottom: 60rpx;
        border-bottom: 1rpx dashed #eee;
        padding-bottom: 40rpx;

        .icon-box {
            width: 160rpx;
            height: 160rpx;
            background: rgba(255, 71, 87, 0.05);
            /* Light tint instead of white */
            border-radius: 30rpx;
            margin: 0 auto 24rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8rpx 20rpx rgba(255, 71, 87, 0.1);
            overflow: hidden;

            .logo-img {
                width: 140rpx;
                height: 140rpx;
            }
        }

        .title {
            font-size: 40rpx;
            font-weight: 800;
            color: #333;
            margin-bottom: 16rpx;
            letter-spacing: 2rpx;
        }

        .subtitle {
            font-size: 24rpx;
            color: #999;
        }
    }

    .policy-content {
        .section {
            margin-bottom: 50rpx;

            .section-title {
                display: flex;
                align-items: center;
                margin-bottom: 24rpx;

                .num {
                    font-size: 32rpx;
                    color: #ff4757;
                    font-weight: 900;
                    margin-right: 16rpx;
                    opacity: 0.2;
                    font-family: Helvetica, sans-serif;
                }

                text:last-child {
                    font-size: 30rpx;
                    color: #333;
                    font-weight: bold;
                }
            }

            .p {
                font-size: 28rpx;
                color: #555;
                line-height: 1.6;
                margin-bottom: 16rpx;
                text-align: justify;
            }

            .list {
                .item {
                    font-size: 26rpx;
                    color: #666;
                    line-height: 1.8;
                    margin-bottom: 8rpx;
                    text-align: justify;
                    padding-left: 20rpx;
                    position: relative;


                }
            }
        }
    }

    .footer-copy {
        margin-top: 80rpx;
        text-align: center;
        border-top: 1rpx solid #f5f5f5;
        padding-top: 40rpx;

        text {
            font-size: 22rpx;
            color: #ccc;
            letter-spacing: 2rpx;
        }
    }
}
</style>
