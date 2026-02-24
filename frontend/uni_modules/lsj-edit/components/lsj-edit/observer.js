/**
 * 观察者
 */
export class Observer {
	constructor(e) {
		this._messages = {};
	}

	// 发布信息
	$fire(type, detail = {}) {
		if (!this._messages[type]) { return; }
		let len = this._messages[type].length;
		for (let i = 0; i < len; i++) {
			this._messages[type][i].call(this, { type, detail });
		}
	}
	// 注册信息
	$on(type, fn) {
		if (this._messages[type] && typeof fn === 'function') {
			this._messages[type].push(fn);
			return;
		}
		this._messages[type] = [fn];
	}
	// 移除信息
	$off(type, fn) {
		if (this._messages[type] instanceof Array) {
			let i = this._messages[type].length - 1;
			for (; i >= 0; i--) {
				this._messages[type][i] === fn &&
					this._messages[type].splice(i, 1);
			}
		}
	}
}