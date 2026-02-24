/**
 * 环境配置
 */
const config = {
    // 开发环境
    development: {
        baseUrl: 'http://127.0.0.1:8080', // 根据您的后端本地端口调整
        wsUrl: 'ws://127.0.0.1:8081/ws'
    },
    // 生产环境
    production: {
        baseUrl: '/api', // 生产环境接口地址
        wsUrl: '/ws'
    }
};

// 当前环境
const env = process.env.NODE_ENV || 'development';

export default config[env as keyof typeof config];
