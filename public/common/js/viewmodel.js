//ViewModel层
//用于各类数据模型的双向绑定和控制区域

(function () {

	var DEBUG = false;

	//ws 链接事件
	MI.listener('ws/open', function (ws) {
		VIEW_MODEL['websocketStatus'] = {};
		var webscoketStatus = VIEW_MODEL['websocketStatus'];
		webscoketStatus['status'] = '服务器连接正常';
		webscoketStatus['is'] = true;
		webscoketStatus['tcolor'] = '#ffffff';
		VIEW_MODEL.newVue('websocketStatus', {
			el: '#websocket'
		});
		VIEW_MODEL.newVue('websocketStatus', {
			el: '#websocket2'
		});
		//左上角用户显示
		VIEW_MODEL.newVue('websocketStatus', {
			el: '#TitleUser'
		});
	});

	MI.listener('ws/close', function (ws) {
		TOOLS.setHeaderTitle("离线 | 当前与服务器断开..");
		var webscoketStatus = VIEW_MODEL['websocketStatus'];
		webscoketStatus['status'] = '!!! 连接断开 !!!';
		webscoketStatus['is'] = false;
		webscoketStatus['tcolor'] = '#ffffff';
	});

	MI.listener('ws/error', function (ws) {
		var webscoketStatus = VIEW_MODEL['websocketStatus'];
		webscoketStatus['status'] = '!!! 连接错误 !!!';
		webscoketStatus['is'] = false;
		webscoketStatus['tcolor'] = '#ffffff';
	});

	//单页生命周期替换事件
	MI.listener('page/live', function (ws) {
		for (var tmp in PAGE) delete PAGE[tmp];
		PAGE = new Object();
	});


	//菜单获取
	MI.routeListener('ws/muem', function (data) {
		//菜单选项选择
		MI.listener("SideMeumClick", function () {
			DEBUG && console.log("--- 菜单选项被选择 ---");
			// MCSERVER.autoColmDo();
		});

		DEBUG && console.log('--- 系统菜单获取成功 ---');

		MCSERVER.username = data.obj.username;
		//虚拟的数据接受，让前端数据得到，菜单在前端建筑
		if (TOOLS.isMaster(MCSERVER.username)) {
			data.obj.items = MCSERVER.meumObject.masterMeum;
		} else {
			data.obj.items = MCSERVER.meumObject.notMasterMeum;
		}
		//copy
		MI.routeCopy('col-muem', data.obj);
		VIEW_MODEL.newVueOnce('col-muem', {
			el: '#SideColFor',
			data: {
				isOnMouse: false
			},
			methods: {
				onRedirect: function (link, api, item) {
					for (let k in this.items) {
						this.items[k].select = false;
					}
					item.select = true;
					DEBUG && console.log('菜单处网页开始跳转:' + link);
					// 取消黑色幕布
					TOOLS.blackJumbotron(false)
					// 触发菜单选项点击事件
					MI.on("SideMeumClick", null);
					// 跳转
					RES.redirectPage(link, api, 'update_page');
				}
			}
		});

	});

	MI.routeListener('index/update', function (data) {
		MI.routeCopy('SystemUp', data.obj);
		MI.routeCopy('VersionShow', data.obj);
	});

	MI.routeListener('center/show', function (data) {
		MI.routeCopy('centerShow', data.obj);
	});

	MI.routeListener('server/view', function (data) {
		MI.routeCopy('ServerList', data.obj);
	});

	//UsersetList
	MI.routeListener('userset/update', function (data) {
		MI.routeCopy('UsersetList', data.obj);
	});

	//单个服务器的资料显示
	MI.routeListener('server/get', function (data) {
		MI.routeCopy('ServerPanel', data.obj);
	});

	//服务器控制台
	MI.routeListener('server/console', function (data) {
		if (data.obj == null) {
			TOOLS.pushMsgWindow('您并不拥有这个服务器的所有权，需要管理员设定');
			VIEW_MODEL['ConsolePanel'].serverData.name = null;
		}
		MI.routeCopy('ConsolePanel', data.obj);
	});

	MI.routeListener('userset/view', function (data) {
		MI.routeCopy('OneUserView', data.obj);
	});

	// Minecraft 服务器终端换行替换符
	var terminalEncode = function (text) {
		var consoleSafe = TOOLS.encode(text);
		consoleSafe = consoleSafe.replace(/\[_b_r_\]/igm, '<br>');
		return consoleSafe;
	}

	// 终端控制台界面，实时接受服务端终端日志
	// 每当控制面板后端发送实时日志，都将第一时间触发此
	MI.routeListener('server/console/ws', function (data) {
		MCSERVER.term.write(data.body);
		return;
		// 文本编码成 html 编码方式
		var consoleSafe = terminalEncode(data.body);
		// 因子页面生命周期，必须单独获取 dom
		var MinecraftConsole = document.getElementById('TerminalMinecraft');
		if (MinecraftConsole == null) {
			console.error('MinecraftConsole is null');
			return;
		}
		// 终端最长长度限制
		var consoleMaxLength = 200000;
		if (MinecraftConsole.innerHTML.length > consoleMaxLength) {
			MinecraftConsole.innerHTML = "<br /><br />[ 控制面板 ]: 日志显示过长，为避免网页卡顿，现已自动清空。<br />[ 控制面板 ]: 若想回看历史日志，请点击右上角刷新按钮，再重新进入点击 [历史] 按钮即可。<br /><br />"
		}
		var flag = false;
		// 判断用户是否自己移动了滚轴
		var BUFF_FONTIER_SIZE_DOWN = MinecraftConsole.scrollHeight - MinecraftConsole.clientHeight;
		flag = (MinecraftConsole.scrollTop + 354 >= BUFF_FONTIER_SIZE_DOWN);
		// 处理控制台颜色与双问号
		consoleSafe = TOOLS.encodeConsoleColor(consoleSafe);
		consoleSafe = TOOLS.deletDoubleS(consoleSafe);
		// 插入到页面控制台中
		MinecraftConsole.innerHTML += consoleSafe;

		if (flag)
			MinecraftConsole.scrollTop = MinecraftConsole.scrollHeight;
	});

	// 获取MC服务端终端日志历史记录
	MI.routeListener('server/console/history', function (data) {
		var consoleSafe = terminalEncode(data.body);
		var MinecraftConsole = document.getElementById('TerminalMinecraft');
		var oldHeightV = MinecraftConsole.scrollHeight;
		//颜色过滤
		consoleSafe = TOOLS.encodeConsoleColor(consoleSafe);
		consoleSafe = TOOLS.deletDoubleS(consoleSafe);
		//incude
		MinecraftConsole.innerHTML = consoleSafe + MinecraftConsole.innerHTML;
		var newHeightV = MinecraftConsole.scrollHeight;
		var resVTopLac = newHeightV - oldHeightV;
		MinecraftConsole.scrollTop = resVTopLac - 999;
	});

	// 普通用户主页
	MI.routeListener('genuser/home', function (data) {
		MI.routeCopy('GenHome', data.obj);
	});

	// 配置项试图
	MI.routeListener('server/properties', function (data) {
		MI.routeCopy('ServerProperties', data.obj);
	});

	// 计划任务列表
	MI.routeListener('schedule/list', function (data) {
		MI.routeCopy('ServerSchedule', data.obj);
	});

})();