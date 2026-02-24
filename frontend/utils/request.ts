import config from './config';

const BASE_URL = config.baseUrl;

interface RequestOptions extends UniApp.RequestOptions {
    params?: any;
}

export const request = (options: RequestOptions) => {
    // 处理 GET 请求的 params 参数
    const method = options.method || 'GET';
    let url = BASE_URL + options.url;
    let data = options.data;

    // 如果是 GET 请求且有 params，将 params 转换为 URL 查询参数
    if (method === 'GET' && options.params) {
        const queryString = Object.keys(options.params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options.params[key])}`)
            .join('&');
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }

    console.log('[Request]', method, url, data); // Debug log
    
    if (method !== 'GET' && options.params) {
        // 非 GET 请求，将 params 合并到 data
        data = { ...options.params, ...data };
    }

    return new Promise((resolve, reject) => {
        uni.request({
            url,
            method: options.method || 'GET',
            data,
            header: {
                ...options.header,
                'Authorization': uni.getStorageSync('token') ? `Bearer ${uni.getStorageSync('token')}` : ''
            },
            success: (res: any) => {
                if (res.statusCode === 401) {
                    uni.removeStorageSync('token');
                    uni.removeStorageSync('userId');
                    uni.removeStorageSync('userInfo');
                    uni.showToast({ title: '请重新登录', icon: 'none' });
                    setTimeout(() => {
                        uni.reLaunch({ url: '/pages/login/login' });
                    }, 1000);
                    reject(res.data);
                    return;
                }
                if (res.statusCode === 200) {
                    if (res.data.code === 200) {
                        resolve(res.data);
                    } else {
                        uni.showToast({
                            title: res.data.msg || 'Error',
                            icon: 'none'
                        });
                        reject(res.data);
                    }
                } else {
                    uni.showToast({
                        title: 'Network Error',
                        icon: 'none'
                    });
                    reject(res);
                }
            },
            fail: (err) => {
                uni.showToast({
                    title: 'Request Failed',
                    icon: 'none'
                });
                reject(err);
            }
        });
    });
};
