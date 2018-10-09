/* step1: ()() */
(function() {
	/* step2: variables */
	//设定一些变量名
	var user_id = '1111';
	var user_fullname = 'John Smith';
	var lng = 122.08;
	var lat = 37.38;

	/* step3: main function(entrance) */
	//入口函数(entrance)
	init();
	
	
	/* step4: define init function */
	function init() {
		 //先用helper function,以Id或标签来取得当前位置
		// Register event listeners
        $('nearby-btn').addEventListener('click', loadNearbyItems);//click之后要load附近items
        $('fav-btn').addEventListener('click', loadFavoriteItems);
        $('recommend-btn').addEventListener('click', loadRecommendedItems);
		
		var welcomeMsg = $('welcome-msg');
		//用innerHTML来在welcome-msg标签上加一句话
		welcomeMsg.innerHTML = 'Welcome, ' + user_fullname;
//		获取当前地理位置
		initGeoLocation();
	}
	
	/* step5: create $ function */
	/** A helper function that creates a DOM element <tag options...>**/
	function $(tag, options) { // $只是function名字，跟jQuery没有任何关系；button或者a标签都可以作为tag；options是指还有其它属性的时候可以使用
		if (!options) {
			return document.getElementById(tag);//取DOM的语法，直接拿到Id
		}
		var element = document.createElement(tag);//有其它属性的话要先自己创建标签，然后手动把属性data加上去
		
		for (var option in options) {
			if (options.hasOwnProperty(option)) {
				element[option] = options[option];
			}
		}
		return element;
	}
	function hideElement(element) {
        element.style.display = 'none';
    }
    function showElement(element, style) {
        var displayStyle = style ? style : 'block';
        element.style.display = displayStyle;
    }
	
	/* step6: create AJAX helper function */
	/**
	 * @param method - GET|POST|PUT|DELETE
	 * @param url - API end point
	 * @param callback - This the successful callback
	 * @param errorHandler - This is the failed callback
	 */
	function ajax(method, url, data, callback, errorHandler) {
		//method指get，post，update，delete
//		url指服务器端地址，要去哪里
//		data是要传输的数据
//		callback回调函数
		
		var xhr = new XMLHttpRequest();//创建http request
		xhr.open(method, url, true);//send request to server by calling open()
		
		xhr.onload = function() {//接收到完整的响应数据之后，才会触发onload
			if (xhr.status == 200) {//先检查状态，200是ok，403是forbidden，404是没找到
				callback(xhr.responseText);//ok的话讲response的数据传递给callback函数
			} else if (xhr.status == 403) {
				onSessionInvalid();
			} else {
				errorHandler();
			}	
		};
		//处理前后端通讯产生的问题
		xhr.onerror = function() {
			console.error("The request couldn't be completed. ");
			errorHandler();
		};
		//处理要传输的数据
		if (data == null) {
			xhr.send();//没有数据要传输，直接发送就行
		} else {//如果有数据要发送，先做header设置，包括设置数据类型以及编码类型
			xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
			xhr.send(data);
		}
	}
	
	/** step 7: initGeoLocation function **/
	function initGeoLocation() {
		if (navigator.geolocation) { //navigator是在window底下，是DOM自带的，window就是全局
			navigator.geolocation.getCurrentPosition(onPositionUpdated, onLoadPositionFailed, {maximumAge : 60000});
//			onPositionUpdated, onLoadPositionFailed都是callback函数
//			onPositionUpdated是在location找到时触发
//			onLoadPositionFailed是在location找不到时触发
			showLoadingMessage('Retrieving your location...');
		} else {
			onLoadPositionFailed();
		}
	}
	
	function onPositionUpdated(position) {//postion是状态信息，是由getCurrentPostion传递下来的
		lat = position.coords.latitude;
		lng = position.coords.longitude;
		loadNearbyItems();
	}
	
	function onLoadPositionFailed() {//失败了就从IP地址获取地理位置
		console.log('failed');
		getLocationFromIP();
		
	}
	function getLocationFromIP() {
		//Get location from http://ipinfo.io/json
		var url = 'http://ipinfo.io/json'//ipinfo.io是自动生成JSON文件的网站，做测试用
		var req = null;//AJAX的第三个参数是data，这里我们没有data来传输所以为null，即直接发送
		ajax('GET', url, req, function(res) {//状态ok的时候才会调用这个callback，即应该可以有location信息
			var result = JSON.parse(res);
			if ('loc' in result) {
				var loc = result.loc.split(',');
				lat = loc[0];
				lng = loc[1];
			} else {
				console.warn('Getting location by IP failed.');
			}
			//step11
			loadNearbyItems();
		});
	}
	
	/** step 11: AJAX call server-side APIs **/
	/**
	 * API #1 Load the nearby items API end point: [GET]
	 * /Dashi/search?user_id=1111&lat=37.38&lon=-122.08
	 */
	function loadNearbyItems() {
		console.log('loadNearbyItems');
		
		//step12
		activeBtn('nearby-btn');//进行高亮。
		
//		active完成之后要开始向后段拿数据，先设定好要传的参数，再通过AJAX向后端发送request
		//The request parameters:
		var url = './search';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;
		var req = JSON.stringify({});//要传的数据
		
		//step13:display loading message
		showLoadingMessage('Loading nearby items...');
		
		//make AJAX call
		ajax('GET', url + '?' + params, req, 
		//successful callback:
		function(res) {
			//成功了拿到了所有的数据放在items里
			var items = JSON.parse(res);
			if (!items || items.length === 0) {//没有数据的话就写warning
				//step14
				showWarningMessage('No nearby item. ');
			} else {
				//step16
//				有数据的话就一条一条的加载数据
				listItems(items);
			}
		}, 
		//unsuccessful callback (error handler):
		function() {
			showErrorMessage('Cannot load nearby items. ');
		});
	}
	/**
     * API #2 Load favorite (or visited) items API end point: [GET]
     * /Dashi/history?user_id=1111
     */
    function loadFavoriteItems() {
        activeBtn('fav-btn');

        // The request parameters
        var url = './history';
        var params = 'user_id=' + user_id;
        var req = JSON.stringify({});

        // display loading message
        showLoadingMessage('Loading favorite items...');

        // make AJAX call
        ajax('GET', url + '?' + params, req, function(res) {
            var items = JSON.parse(res);
            if (!items || items.length === 0) {
                showWarningMessage('No favorite item.');
            } else {
                listItems(items);
            }
        }, function() {
            showErrorMessage('Cannot load favorite items.');
        });
    }

    /**
     * API #3 Load recommended items API end point: [GET]
     * /Dashi/recommendation?user_id=1111
     */
    function loadRecommendedItems() {
        activeBtn('recommend-btn');

        // The request parameters
        var url = './recommendation';
        var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;

        var req = JSON.stringify({});

        // display loading message
        showLoadingMessage('Loading recommended items...');

        // make AJAX call
        ajax(
            'GET',
            url + '?' + params,
            req,
            // successful callback
            function(res) {
                var items = JSON.parse(res);
                if (!items || items.length === 0) {
                    showWarningMessage('No recommended item. Make sure you have favorites.');
                } else {
                    listItems(items);
                }
            },
            // failed callback
            function() {
                showErrorMessage('Cannot load recommended items.');
            });
    }

    /**
     * API #4 Toggle favorite (or visited) items
     * 
     * @param item_id -
     *            The item business id
     * 
     * API end point: [POST]/[DELETE] /Dashi/history request json data: {
     * user_id: 1111, visited: [a_list_of_business_ids] }
     */
    function changeFavoriteItem(item_id) {
        // Check whether this item has been visited or not
        var li = $('item-' + item_id);
        var favIcon = $('fav-icon-' + item_id);
        var favorite = li.dataset.favorite !== 'true';

        // The request parameters
        var url = './history';
        var req = JSON.stringify({
            user_id: user_id,
            favorite: [item_id]
        });
        var method = favorite ? 'POST' : 'DELETE';

        ajax(method, url, req,
            // successful callback
            function(res) {
                var result = JSON.parse(res);
                if (result.result === 'SUCCESS') {
                    li.dataset.favorite = favorite;
                    favIcon.className = favorite ? 'fa fa-heart' : 'fa fa-heart-o';
                }
            });
    }
	/** step 12: activeBtn function **/
	/**
	 * A helper function that makes a navigation button active
	 * 
	 * @param btnId - The id of the navigation button
	 */
	function activeBtn(btnId) {
		//用byClassName是因为左边三个标签ID不同但class相同，为了使highlight方法可以重复使用
		var btns = document.getElementsByClassName('main-nav-btn');
		
		//deactivate all navigation buttons先把之前高亮的全取消效果
		for (var i = 0; i < btns.length; i++) {
			//replace后跟的使regular expression，/\b和\b/是找边界，即找到active类就用空格替换掉
			btns[i].className = btns[i].className.replace(/\bactive\b/, '');
		}
		
//		找到当前激活的Id
		var btn = $(btnId);
		btn.className += ' active';
	}
	
	/** step 13: showLoadingMessage function **/
	function showLoadingMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> '
				+ msg + '</p>';
	}
	
	/** step 14: showWarningMessage function **/
	function showWarningMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i> '
				+ msg + '</p>';
	}
	
	/** step15: showErrorMessage function **/
	function showErrorMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-circle"></i> '
				+ msg + '</p>';
	}
	
	/** step16: listItems function **/
	/**
	 * @param items - An array of item JSON objects
	 */
	function listItems(items) {
//		Clear the current results 
		var itemList = $('item-list');
		itemList.innerHTML = '';//把当前在显示的"Retriving data..."取消
//		清空完再一条一条添加
		for (var i = 0; i < items.length; i++) {
			//step17
			addItem(itemList, items[i]);
		}
	}
	
	/** step17: addItem function **/
	/**
	 * Add item to the list
	 * @param itemList - The <ul id="item-list"> tag
	 * @param item - The item data (JSON object)
	 */
	function addItem(itemList, item) {
		var item_id = item.item_id;
		
		// create the <li> tag and specify the id and class attributes
		//$是helper function，tag为‘li’，并且后面的option不为空（有id和calssname
		var li = $('li', {
//			这是li中的id
			id : 'item-' + item_id,
			className : 'item'
		});
		
		//set the data attribute
		li.dataset.item_id = item_id;
		li.dataset.favorite = item.favorite;
		
		// item image
		if (item.image_url) {
			li.appendChild($('img', {
				src : item.image_url
			}));
		} else {
			//如果后端数据没给图片url，那么添加一个默认图片
			li.appendChild($('img', {
				src : 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
			}))
		}
		// section：放itemname和category和小星星的部分
		var section = $('div', {});
		// title
		var title = $('a', {
			href : item.url,
			target : '_blank',//可点击属性，即点击之后在新页面打开
			className : 'item-name'
		});
		title.innerHTML = item.name;//把字写上去
		section.appendChild(title);//把写好的字放到section上去；append使得所有东西上下排列
		// category
		var category = $('p', {
			className : 'item-category'
		});
		category.innerHTML = 'Category: ' + item.categories.join(', ');
		section.appendChild(category);
		//星星(rating)
		var stars = $('div', {
			className : 'stars'
		});
		for (var i = 0; i < item.rating; i++) {
			var star = $('i', {
				className : 'fa fa-star'
			});
			stars.appendChild(star);
		}

		if (('' + item.rating).match(/\.5$/)) {
			stars.appendChild($('i', {
				className : 'fa fa-star-half-o'
			}));
		}
		section.appendChild(stars);

		li.appendChild(section);//最后把做好的section放到li上去

		// address
		var address = $('p', {
			className : 'item-address'
		});

		address.innerHTML = item.address.replace(/,/g, '<br/>').replace(/\"/g,
				'');
		li.appendChild(address);

		// favorite link
		var favLink = $('p', {
			className : 'fav-link'
		});

		favLink.onclick = function() {
			changeFavoriteItem(item_id);
		};

		favLink.appendChild($('i', {
			id : 'fav-icon-' + item_id,
			className : item.favorite ? 'fa fa-heart' : 'fa fa-heart-o'
		}));

		li.appendChild(favLink);

		itemList.appendChild(li);//li做好后放到itemList（是一个ul）上去
	}

})();//模拟块级级元素，是个闭包Immediately involved function expression，想定义一个函数，只用一次，而且要立即执行
// (function(){})();
