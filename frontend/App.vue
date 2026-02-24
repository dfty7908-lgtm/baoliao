<script>
import websocket from './utils/websocket';
import config from './utils/config';

export default {
	onLaunch: function () {
		console.log('[App] onLaunch');
		const options = uni.getLaunchOptionsSync();
		if (options.query && options.query.code) {
			uni.setStorageSync('inviteCode', options.query.code);
			console.log('[App] Captured invite code:', options.query.code);
		}

		// Initialize WebSocket
		const userInfo = uni.getStorageSync('userInfo');
		if (userInfo && userInfo.id) {
			websocket.connect(userInfo.id);
			this.loadUnreadCount();
		}

		// Listen for messages globally to update TabBar badge
		uni.$on('ws_message', () => {
			this.loadUnreadCount();
		});
	},
	methods: {
		loadUnreadCount() {
			const token = uni.getStorageSync('token');
			if (!token) return;

			const userInfo = uni.getStorageSync('userInfo');

			uni.request({
				url: config.baseUrl + '/chat/unread-count',
				header: { 'Authorization': 'Bearer ' + token },
				success: (res) => {
					if (res.data && res.data.code === 200) {
						const count = res.data.data;
						try {
							if (count > 0) {
								if (userInfo?.role === 'ADMIN') {
									uni.removeTabBarBadge({ index: 2 });
									uni.setTabBarBadge({
										index: 3,
										text: count.toString()
									});
								} else {
									uni.removeTabBarBadge({ index: 3 });
									uni.setTabBarBadge({
										index: 2,
										text: count.toString()
									});
								}
							} else {
								uni.removeTabBarBadge({ index: 2 });
								uni.removeTabBarBadge({ index: 3 });
							}
						} catch (e) { }
					}
				}
			});
		}
	},
	onShow: function () {
		console.log('App Show');
		// 切回前台时确保 WebSocket 连接存活
		websocket.ensureConnected();
		this.loadUnreadCount();
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style lang="scss">
/*每个页面公共css */
@import "uview-plus/index.scss";

page {
	font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
</style>
