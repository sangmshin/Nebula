window.performance.mark('nebula_inside_nebulajs');
jQuery.noConflict();

/*==========================
 DOM Ready
 ===========================*/

jQuery(function(){
	window.performance.mark('nebula_dom_ready_start');

	//Utilities
	cacheSelectors();
	nebulaHelpers();
	svgImgs();
	errorMitigation();

	//Navigation
	subnavExpanders();
	menuSearchReplacement();

	//Search
	singleResultDrawer();
	pageSuggestion();

	//Forms
	nebulaLiveValidator();
	cf7Functions();
	cf7LocalStorage();

	//Interaction
	socialSharing();
	initVideoTracking();
	animationTriggers();
	nebulaScrollTo();

	visibilityChangeActions();
	nebula.dom.document.on('visibilitychange', function(){
		visibilityChangeActions();
	});

	//Prevent events from sending before the pageview
	if ( isGoogleAnalyticsReady() ){
		initEventTracking();
	}

	window.performance.mark('nebula_dom_ready_end');
	window.performance.measure('nebula_dom_ready_functions', 'nebula_dom_ready_start', 'nebula_dom_ready_end');
}); //End Document Ready


/*==========================
 Window Load
 ===========================*/

jQuery(window).on('load', function(){
	window.performance.mark('nebula_window_load_start');

	cacheSelectors();

	if ( typeof nebula.snapchatPageShown === 'undefined' || nebula.snapchatPageShown === true ){ //Don't automatically begin event tracking for Snapchat preloading
		initEventTracking();
	}

	initBootstrapFunctions();
	performanceMetrics();
	lazyLoadAssets();

	//Navigation
	overflowDetector();

	//Search
	wpSearchInput();
	mobileSearchPlaceholder();
	autocompleteSearchListeners();
	advancedSearchListeners();
	searchValidator();
	searchTermHighlighter();
	emphasizeSearchTerms();

	//Forms
	nebulaAddressAutocomplete('#address-autocomplete', 'nebulaGlobalAddressAutocomplete');

	facebookSDK();

	nebulaBattery();
	nebulaNetworkConnection();

	nebula.lastWindowWidth = nebula.dom.window.width(); //Prep resize detection (Is this causing a forced reflow?)
	jQuery('a, li, tr').removeClass('hover');
	nebula.dom.html.addClass('loaded');

	registerServiceWorker();

	networkAvailable(); //Call it once on load, then listen for changes
	jQuery(window).on('offline online', function(){
		networkAvailable();
	});

	window.performance.mark('nebula_window_load_end');
	window.performance.measure('nebula_window_load_functions', 'nebula_window_load_start', 'nebula_window_load_end');
	window.performance.measure('nebula_fully_loaded', 'navigationStart', 'nebula_window_load_end');
}); //End Window Load


/*==========================
 Window Resize
 ===========================*/

jQuery(window).on('resize', function(){
	debounce(function(){
		if ( typeof nebula.lastWindowWidth !== 'undefined' && nebula.dom.window.width() != nebula.lastWindowWidth ){ //If the width actually changed
			nebula.lastWindowWidth = nebula.dom.window.width();
			mobileSearchPlaceholder();
		}
	}, 500, 'window resize');
}); //End Window Resize


/*==========================
 Additional References
 ===========================*/

nebula.regex = {
	email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i, //From JS Lint: Expected ']' and instead saw '['.
	phone: /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/, //To allow letters, you'll need to convert them to their corresponding number before matching this RegEx.
	date: {
		mdy: /^((((0[13578])|([13578])|(1[02]))[.\/-](([1-9])|([0-2][0-9])|(3[01])))|(((0[469])|([469])|(11))[.\/-](([1-9])|([0-2][0-9])|(30)))|((2|02)[.\/-](([1-9])|([0-2][0-9]))))[.\/-](\d{4}|\d{2})$/,
		ymd: /^(\d{4}|\d{2})[.\/-]((((0[13578])|([13578])|(1[02]))[.\/-](([1-9])|([0-2][0-9])|(3[01])))|(((0[469])|([469])|(11))[.\/-](([1-9])|([0-2][0-9])|(30)))|((2|02)[.\/-](([1-9])|([0-2][0-9]))))$/,
	},
	hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/,
	ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
	url: /(\(?(?:(http|https|ftp):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?)/i,
};

nebula.timings = [];
nebula.videos = {};


/*==========================
 Optimization Functions
 ===========================*/

//Cache DOM selectors
function cacheSelectors(){
	nebula.dom = {
		document: jQuery(document),
		window: jQuery(window),
		html: jQuery('html'),
		body: jQuery('body'),
	};
}

//Nebula Service Worker
function registerServiceWorker(){
	jQuery('.nebula-sw-install-button').addClass('inactive');

	if ( nebula.site.options.sw && 'serviceWorker' in navigator ){ //Firefox 44+, Chrome 45+, Edge 17+, Safari 12+
		window.performance.mark('nebula_sw_registration_start');
		//navigator.serviceWorker.register(nebula.site.sw_url, {cache: 'max-age=0'}).then(function(registration){
		navigator.serviceWorker.register(nebula.site.sw_url).then(function(registration){
			//console.log('ServiceWorker registration successful with scope: ', registration.scope);
			//console.debug(registration);

			window.performance.mark('nebula_sw_registration_end');
			window.performance.measure('nebula_sw_registration', 'nebula_sw_registration_start', 'nebula_sw_registration_end');

			//Unregister the ServiceWorker on ?debug
			if ( nebula.dom.html.hasClass('debug') ){
				registration.unregister();
				return false;
			}

			registration.onupdatefound = function(){ //Triggered if sw.js changes
				//The updatefound event implies that registration.installing is set; see https://w3c.github.io/ServiceWorker/#service-worker-registration-updatefound-event
				registration.installing.onstatechange = function(){
					if ( registration.installing ){ //...but that isn't the case sometimes...
						switch ( registration.installing.state ){
							case 'installed':
								if ( navigator.serviceWorker.controller ){
									//At this point, the old content will have been purged and the fresh content will have been added to the cache. It's the perfect time to display a "New content is available; please refresh." message.
								} else {
									//At this point, everything has been precached for offline use.
								}
								break;
							case 'redundant':
								ga('send', 'exception', {'exDescription': '(JS) The installing service worker became redundant.', 'exFatal': false});
								break;
						}
					}
				};
			};

			nebulaPredictiveCacheListeners();

			//Listen for messages from the Service Worker
			navigator.serviceWorker.addEventListener('message', function(event){
				nebula.dom.document.trigger('nebula_sw_message', event.data);
			});

			return navigator.serviceWorker.ready; //This can be listened for elsewhere with navigator.serviceWorker.ready.then(function(){ ... });
		}).catch(function(error){
			ga('send', 'exception', {'exDescription': '(JS) ServiceWorker registration failed: ' + error, 'exFatal': false});
		});

		//Listen for ability to show SW install prompt
		window.addEventListener('beforeinstallprompt', function(event){
			event.preventDefault(); //Prevent Chrome <= 67 from automatically showing the prompt
			installPromptEvent = event; //Stash the event so it can be triggered later.
			jQuery('.nebula-sw-install-button').removeClass('inactive').addClass('ready');
		});

		//Trigger the SW install prompt and handle user choice
		nebula.dom.document.on('click', '.nebula-sw-install-button', function(){
			if ( typeof installPromptEvent !== 'undefined' ){
				jQuery('.nebula-sw-install-button').removeClass('ready').addClass('prompted');

				installPromptEvent.prompt(); //Show the modal add to home screen dialog
				ga('send', 'event', 'Progressive Web App', 'Install Prompt Shown', event.platforms.join(', '));

				//Wait for the user to respond to the prompt
				installPromptEvent.userChoice.then(function(result){
					jQuery('.nebula-sw-install-button').removeClass('prompted').addClass('ready');
					ga('send', 'event', 'Progressive Web App', 'Install Prompt User Choice', result.outcome);
					nv('event', 'Install Prompt ' + result.outcome);
				});
			} else {
				jQuery('.nebula-sw-install-button').removeClass('ready').addClass('inactive');
			}

			return false;
		});

		//PWA Installed
		window.addEventListener('appinstalled', function(){
			jQuery('.nebula-sw-install-button').removeClass('ready').addClass('success');
			ga('send', 'event', 'Progressive Web App', 'App Installed', 'The app has been installed');
		});
	}
}

//Detections for events specific to predicting the next pageview.
function nebulaPredictiveCacheListeners(){
	if ( 'caches' in window && !nebula.dom.body.hasClass('offline') ){
		//Any post listing page
		if ( jQuery('.first-post .entry-title a').length ){
			nebulaAddToCache(jQuery('.first-post .entry-title a').attr('href'));
		}

		//Internal link hovers
		var predictiveHoverTimeout;
		jQuery('a').hover(function(){
			oThis = jQuery(this);

			if ( !predictiveHoverTimeout ){
				predictiveHoverTimeout = window.setTimeout(function(){
					predictiveHoverTimeout = null; //Reset the timer
					if ( oThis.attr('target') !== '_blank' ){
						nebulaAddToCache(oThis.attr('href'));
					}
				}, 250);
			}
		}, function(){
			if ( predictiveHoverTimeout ){
				window.clearTimeout(predictiveHoverTimeout);
				predictiveHoverTimeout = null;
			}
		});
	}
}

//Add items to the cache
function nebulaAddToCache(url){
	if ( 'caches' in window && !nebula.dom.body.hasClass('offline') ){
		//Since there can be multiple caches, the cache name must match what is in sw.js!

		//Prevent caching of URLs containing certain strings
		var substrings = ['chrome-extension://', '/wp-login.php', '/wp-admin', 'analytics', 'collect', 'no-cache', '//#'];
		var length = substrings.length;
		while ( length-- ){
			if ( url.indexOf(substrings[length]) !== -1 ){
				return false; //Do not cache (disallowed string)
			}
		}

		if ( url.length > 1 && url.indexOf('#') !== 0 && url.indexOf('?') === -1 ){
			caches.open(nebula.site.cache).then(function(cache){
				cache.add(url);
			});

			return true;
		} else {
			return false; //Do not cache (additional criteria)
		}
	} else {
		return false;
	}
}

//Send data to other tabs/windows using the Service Worker
function nebulaPostMessage(data){
	if ( navigator.serviceWorker && navigator.serviceWorker.controller ){
		navigator.serviceWorker.controller.postMessage(data);
	}
}

/*==========================
 Detection Functions
 ===========================*/

//Check (or set) network availability (online/offline)
function networkAvailable(){
	if ( navigator.onLine ){
		nebula.dom.body.removeClass('offline');
		localStorage.setItem('network_connection', 'online');
	} else {
		nebula.dom.body.addClass('offline');
		localStorage.setItem('network_connection', 'offline');
	}

	jQuery(document).trigger('nebula_network_change');
}

//Page Visibility
function visibilityChangeActions(){
	if ( document.visibilityState === 'prerender' ){ //Page was prerendered
		ga('send', 'event', 'Page Visibility', 'Prerendered', 'Page loaded before tab/window was visible', {'nonInteraction': true});
		pauseAllVideos(false);
	}

	if ( document.visibilitystate === 'hidden' ){ //Page is hidden
		nebula.dom.document.trigger('nebula_page_hidden');
		nebula.dom.body.addClass('page-visibility-hidden');
		pauseAllVideos(false);
	} else { //Page is visible
		networkAvailable();
		nebula.dom.document.trigger('nebula_page_visible');
		nebula.dom.body.removeClass('page-visibility-hidden');
	}
}

//Record performance timing
function performanceMetrics(){
	if ( window.performance && window.performance.timing ){ //Safari 11+
		setTimeout(function(){
			var timingCalcuations = {
				'Redirect': {start: Math.round(performance.timing.redirectStart - performance.timing.navigationStart), duration: Math.round(performance.timing.redirectEnd - performance.timing.redirectStart)},
				'Unload': {start: Math.round(performance.timing.unloadStart - performance.timing.navigationStart), duration: Math.round(performance.timing.unloadEnd - performance.timing.unloadStart)},
				'App Cache': {start: Math.round(performance.timing.fetchStart - performance.timing.navigationStart), duration: Math.round(performance.timing.domainLookupStart - performance.timing.fetchStart)},
				'DNS': {start: Math.round(performance.timing.domainLookupStart - performance.timing.navigationStart), duration: Math.round(performance.timing.domainLookupEnd - performance.timing.domainLookupStart)},
				'TCP': {start: Math.round(performance.timing.connectStart - performance.timing.navigationStart), duration: Math.round(performance.timing.connectEnd - performance.timing.connectStart)},
				'Request': {start: Math.round(performance.timing.requestStart - performance.timing.navigationStart), duration: Math.round(performance.timing.responseStart - performance.timing.requestStart)},
				'Response': {start: Math.round(performance.timing.responseStart - performance.timing.navigationStart), duration: Math.round(performance.timing.responseEnd - performance.timing.responseStart)},
				'Processing': {start: Math.round(performance.timing.domLoading - performance.timing.navigationStart), duration: Math.round(performance.timing.loadEventStart - performance.timing.domLoading)},
				'onLoad': {start: Math.round(performance.timing.loadEventStart - performance.timing.navigationStart), duration: Math.round(performance.timing.loadEventEnd - performance.timing.loadEventStart)},
				'DOM Ready': {start: 0, duration: Math.round(performance.timing.domComplete - performance.timing.navigationStart)},
				'Total Load': {start: 0, duration: Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart)}
			}

			//If ?timings exists or if developer
			if ( typeof console.table === 'function' && (get('timings') || (has(nebula, 'user.staff') && nebula.user.staff === 'developer')) ){
				clientTimings = {};
				jQuery.each(timingCalcuations, function(name, timings){
					if ( !isNaN(timings.duration) && timings.duration > 0 && timings.duration < 6000000 ){ //Ignore empty values
						clientTimings[name] = {
							start: timings.start,
							duration: timings.duration,
							elapsed: timings.start + timings.duration
						}
					}
				});

				console.groupCollapsed('Performance');
				console.table(jQuery.extend(nebula.site.timings, clientTimings));
				console.groupEnd();
			}

			if ( timingCalcuations['Processing'] && timingCalcuations['DOM Ready'] && timingCalcuations['Total Load'] ){
				ga('set', nebula.analytics.metrics.serverResponseTime, timingCalcuations['Processing'].start);
				ga('set', nebula.analytics.metrics.domReadyTime, timingCalcuations['DOM Ready'].duration);
				ga('set', nebula.analytics.metrics.windowLoadedTime, timingCalcuations['Total Load'].duration);
				ga('send', 'event', 'Performance Timing', 'track', 'Used to deliver performance metrics to Google Analytics', {'nonInteraction': true});

				//Send as User Timings as well
				ga('send', 'timing', 'Performance Timing', 'Server Response', timingCalcuations['Processing'].start, 'Navigation start until server response finishes (includes PHP execution time)');
				ga('send', 'timing', 'Performance Timing', 'DOM Ready', timingCalcuations['DOM Ready'].duration, 'Navigation start until DOM ready');
				ga('send', 'timing', 'Performance Timing', 'Window Load', timingCalcuations['Total Load'].duration, 'Navigation start until window load');
			}
		}, 0);
	}
}

//Sub-menu viewport overflow detector
function overflowDetector(){
	jQuery('.menu li.menu-item').on({
		'mouseenter focus focusin': function(){
			if ( jQuery(this).children('.sub-menu').length ){
				var submenuLeft = jQuery(this).children('.sub-menu').offset().left; //Left side of the sub-menu
				var submenuRight = submenuLeft+jQuery(this).children('.sub-menu').width(); //Right side of the sub-menu

				if ( submenuRight > nebula.dom.window.width() ){ //If the right side is greater than the width of the viewport
					jQuery(this).children('.sub-menu').addClass('overflowing');
				} else {
					jQuery(this).children('.sub-menu').removeClass('overflowing');
				}
			}
		},
		'mouseleave': function(){
			jQuery(this).children('.sub-menu').removeClass('overflowing');
		}
	});
}

//Check if Google Analytics is ready
function isGoogleAnalyticsReady(){
	if ( navigator.doNotTrack || window.doNotTrack ){
		return false;
	}

	if ( has(nebula, 'analytics.isReady') ){
		nebula.dom.html.removeClass('no-gajs');
		return true;
	}

	nebula.dom.html.addClass('no-gajs');
	return false;
}

//Detect Battery Level
function nebulaBattery(){
	nebula.user.client.device.battery = false;

	if ( 'getBattery' in navigator ){ //Chrome only
		navigator.getBattery().then(function(battery){
			nebulaBatteryData(battery);
			jQuery(battery).on('chargingchange levelchange', function(){
				nebulaBatteryData(battery);
			});
		});
	}
}

//Prep battery info for lookup
function nebulaBatteryData(battery){
	nebula.user.client.device.battery = {
		mode: ( battery.charging )? 'Adapter' : 'Battery',
		charging: ( battery.charging )? true : false,
		chargingTime: battery.chargingTime,
		dischargingTime: battery.dischargingTime,
		level: battery.level,
		percentage: parseFloat((battery.level*100).toFixed(0)) + '%',
	};

	//These definitions will be transported with the Performance Metric event payload
	ga('set', nebula.analytics.dimensions.batteryMode, nebula.user.client.device.battery.mode);
	ga('set', nebula.analytics.dimensions.batteryPercent, nebula.user.client.device.battery.percentage);
	ga('set', nebula.analytics.metrics.batteryLevel, nebula.user.client.device.battery.level);

	nebula.dom.document.trigger('batteryChange');
}

//Detect Network Connection
function nebulaNetworkConnection(){
	var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || false;
	if ( connection ){
		nebula.user.client.device.connection = {
			type: connection.type,
			metered: connection.metered,
			bandwidth: connection.bandwidth,
		}
	}
}


/*==========================
 Social Functions
 ===========================*/

//Load the SDK asynchronously
function facebookSDK(){
	if ( jQuery('[class*="fb-"]:not(.fb-root)').length || jQuery('.require-fbsdk').length ){ //Only load the Facebook SDK when needed
		(function(d, s, id) {
			var js, fjs = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) return;
			js = d.createElement(s); js.id = id;
			js.src = 'https://connect.facebook.net/' + nebula.site.charset + '/all.js#xfbml=1&version=v3.0';
			fjs.parentNode.insertBefore(js, fjs);
		}(document, 'script', 'facebook-jssdk'));
	}
}


//Social sharing buttons
function socialSharing(){
	var encloc = encodeURIComponent(window.location.href);
	var enctitle = encodeURIComponent(document.title);
	var popupTop = jQuery(window).height()/2-275;
	var popupLeft = jQuery(window).width()/2-225;
	var popupAttrs = 'top=' + popupTop + ', left=' + popupLeft + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0, chrome=yes, personalbar=0';

	//Facebook
	jQuery('.fbshare, a.nebula-share.facebook').attr('href', 'http://www.facebook.com/sharer.php?u=' + encloc + '&t=' + enctitle).attr({'target': '_blank', 'rel': 'noopener'}).on('click', function(){
		ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
		ga('send', 'event', 'Social', 'Share', 'Facebook');
		nv('event', 'Facebook Share');

		if ( nebula.dom.body.hasClass('desktop') ){
			window.open(jQuery(this).attr('href'), 'facebookShareWindow', 'width=550, height=450, ' + popupAttrs);
			return false;
		}
	});

	//Twitter
	jQuery('.twshare, a.nebula-share.twitter').attr('href', 'https://twitter.com/intent/tweet?text=' + enctitle + '&url=' + encloc).attr({'target': '_blank', 'rel': 'noopener'}).on('click', function(){
		ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
		ga('send', 'event', 'Social', 'Share', 'Twitter');
		nv('event', 'Twitter Share');

		if ( nebula.dom.body.hasClass('desktop') ){
			window.open(jQuery(this).attr('href'), 'twitterShareWindow', 'width=600, height=254, ' + popupAttrs);
			return false;
		}
	});

	//LinkedIn
	jQuery('.lishare, a.nebula-share.linkedin').attr('href', 'http://www.linkedin.com/shareArticle?mini=true&url=' + encloc + '&title=' + enctitle).attr({'target': '_blank', 'rel': 'noopener'}).on('click', function(){
		ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
		ga('send', 'event', 'Social', 'Share', 'LinkedIn');
		nv('event', 'LinkedIn Share');

		if ( nebula.dom.body.hasClass('desktop') ){
			window.open(jQuery(this).attr('href'), 'linkedinShareWindow', 'width=600, height=473, ' + popupAttrs);
			return false;
		}
	});

	//Pinterest
	jQuery('.pinshare, a.nebula-share.pinterest').attr('href', 'http://pinterest.com/pin/create/button/?url=' + encloc).attr({'target': '_blank', 'rel': 'noopener'}).on('click', function(){
		ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
		ga('send', 'event', 'Social', 'Share', 'Pinterest');
		nv('event', 'Pinterest Share');

		if ( nebula.dom.body.hasClass('desktop') ){
			window.open(jQuery(this).attr('href'), 'pinterestShareWindow', 'width=600, height=450, ' + popupAttrs);
			return false;
		}
	});

	//Email
	jQuery('.emshare, a.nebula-share.email').attr('href', 'mailto:?subject=' + enctitle + '&body=' + encloc).attr({'target': '_blank', 'rel': 'noopener'}).on('click', function(){
		ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
		ga('send', 'event', 'Social', 'Share', 'Email');
		nv('event', 'Email Share');
	});

	//Web Share API
	if ( 'share' in navigator && !nebula.dom.body.hasClass('desktop') ){ //Chrome 61+
		nebula.dom.document.on('click', 'a.nebula-share.webshare, a.nebula-share.shareapi', function(){
			oThis = jQuery(this);

			navigator.share({
				title: document.title,
				text: nebula.post.excerpt,
				url: window.location.href
			}).then(function(){
				ga('send', 'event', 'Social', 'Share', 'Web Share API');
				nv('event', 'Web Share API');
				oThis.addClass('success');
				createCookie('shareapi', true);
			}).catch(function(error){
				ga('send', 'exception', {'exDescription': '(JS) Share API Error: ' + error, 'exFatal': false});
				oThis.addClass('error').text('Sharing Error');
				createCookie('shareapi', false);
			});

			return false;
		});

		createCookie('shareapi', true); //Set a cookie to speed up future page loads by not loading third-party share buttons.
	} else {
		jQuery('a.nebula-share.webshare, a.nebula-share.shareapi').addClass('hidden');
	}
}


/*==========================
 Analytics Functions
 ===========================*/

//Call the event tracking functions (since it needs to happen twice).
function initEventTracking(){
	if ( nebula.user.dnt ){
		return false;
	}

	once(function(){
		cacheSelectors(); //If event tracking is initialized by the async GA callback, selectors won't be cached yet

		if ( typeof window.ga === 'function' ){
			window.ga(function(tracker){
				nebula.dom.document.trigger('nebula_ga_available', tracker);
				nebula.user.cid = tracker.get('clientId');
			});
		}

		if ( (has(nebula, 'site.options.adblock_detect') && nebula.site.options.adblock_detect) && has(nebula, 'site.options.ga_server_side_fallback') && nebula.site.options.ga_server_side_fallback ){ //If tracking adblock detection
			if ( has(nebula, 'analytics.isReady') && !nebula.analytics.isReady ){ //if isReady object key exists and is not set to true then GA is blocked
				nebula.dom.document.trigger('nebula_ga_blocked');

				//Send Pageview
				jQuery.ajax({
					type: "POST",
					url: nebula.site.ajax.url + '?prps=gapv',
					data: {
						nonce: nebula.site.ajax.nonce,
						action: 'nebula_ga_ajax',
						fields: {
							hitType: 'pageview',
							location: window.location.href,
							title: document.title,
							ua: navigator.userAgent
						},
					},
					timeout: 60000
				});

				//Handle event tracking
				function ga(command, hitType, category, action, label, value, fieldsObject){
					if ( command === 'send' && hitType === 'event' ){
						var ni = 0;
						if ( fieldsObject && fieldsObject.nonInteraction === 1 ){
							ni = 1;
						}

						jQuery.ajax({
							type: "POST",
							url: nebula.site.ajax.url + '?prps=gahit',
							data: {
								nonce: nebula.site.ajax.nonce,
								action: 'nebula_ga_ajax',
								fields: {
									hitType: 'event',
									category: category,
									action: action,
									label: label,
									value: value,
									ni: ni,
									location: window.location.href,
									title: document.title,
									ua: navigator.userAgent
								},
							},
							timeout: 60000
						});
					}
				}
			}
		}

		nebula.dom.document.trigger('nebula_event_tracking');

		eventTracking();
		scrollDepth();
		ecommerceTracking();
	}, 'nebula event tracking');
}

//Google Analytics Universal Analytics Event Trackers
function eventTracking(){
	//Btn Clicks
	nebula.dom.document.on('mousedown', "button, .btn", function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', nebula.analytics.dimensions.eventIntent, eventIntent);

		var btnText = jQuery(this).val() || jQuery(this).text();
		if ( jQuery.trim(btnText) === '' ){
			btnText = '(Unknown)';
		}

		ga('send', 'event', 'Button Click', jQuery.trim(btnText), jQuery(this).attr('href'));
	});

	//Bootstrap "Collapse" Accordions
	nebula.dom.document.on('shown.bs.collapse', function(e){
		var accordionHeaderLabel = jQuery.trim(jQuery('[data-target="#' + e.target.id + '"]').text()) || e.target.id;
		ga('send', 'event', 'Accordion', 'Shown', accordionHeaderLabel);
	});
	nebula.dom.document.on('hidden.bs.collapse', function(e){
		var accordionHeaderLabel = jQuery.trim(jQuery('[data-target="#' + e.target.id + '"]').text()) || e.target.id;
		ga('send', 'event', 'Accordion', 'Hidden', accordionHeaderLabel);
	});

	//Bootstrap Modals
	nebula.dom.document.on('shown.bs.modal', function(e){
		var modalHeaderLabel = jQuery.trim(jQuery('#' + e.target.id + ' .modal-title').text()) || e.target.id;
		ga('send', 'event', 'Modal', 'Shown', modalHeaderLabel);
	});
	nebula.dom.document.on('hidden.bs.modal', function(e){
		var modalHeaderLabel = jQuery.trim(jQuery('#' + e.target.id + ' .modal-title').text()) || e.target.id;
		ga('send', 'event', 'Modal', 'Hidden', e.target.id);
	});

	//Bootstrap Carousels (Sliders)
	nebula.dom.document.on('slide.bs.carousel', function(e){
		if ( window.event ){ //Only if sliding manually
			var sliderName = e.target.id || e.target.title || e.target.className.replace(' ', '.');
			var activeSlide = jQuery(e.target).find('.carousel-item').eq(e.to);
			var activeSlideName = activeSlide.attr('id') || activeSlide.attr('title') || 'Unnamed';
			var prevSlide = jQuery(e.target).find('.carousel-item').eq(e.from);
			var prevSlideName = prevSlide.attr('id') || prevSlide.attr('title') || 'Unnamed';
			ga('send', 'event', 'Carousel', sliderName, 'Slide to ' + e.to + ' (' + activeSlideName + ') from ' + e.from + ' (' + prevSlideName + ')');
		}
	});

	//Generic Form Submissions
	//This event will be a duplicate if proper event tracking is setup on each form, but serves as a safety net.
	//It is not recommended to use this event for goal tracking unless absolutely necessary (this event does not check for submission success)!
	nebula.dom.document.on('submit', 'form', function(e){
		var formID = e.target.id || 'form.' + e.target.className.replace(' ', '.');
		ga('send', 'event', 'Generic Form', 'Submit', formID);
	});

	//Notable File Downloads
	jQuery.each(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'zipx', 'rar', 'gz', 'tar', 'txt', 'rtf', 'ics', 'vcard'], function(index, extension){
		nebula.dom.document.on('mousedown', "a[href$='." + extension + "'], a[href$='." + extension.toUpperCase() + "']", function(e){
			eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
			ga('set', nebula.analytics.dimensions.eventIntent, eventIntent);
			var fileName = jQuery(this).attr('href').substr(jQuery(this).attr('href').lastIndexOf("/")+1);
			ga('send', 'event', 'Download', extension, fileName);
			if ( typeof fbq === 'function' ){fbq('track', 'ViewContent', {content_name: fileName});}
			nv('event', 'File Download');
		});
	});

	//Notable Downloads
	nebula.dom.document.on('mousedown', ".notable a, a.notable", function(e){
		var filePath = jQuery(this).attr('href');
		if ( jQuery.trim(filePath).length && filePath !== '#' ){
			eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
			ga('set', nebula.analytics.metrics.notableDownloads, 1);
			var linkText = jQuery(this).text();
			var fileName = filePath.substr(filePath.lastIndexOf("/")+1);
			ga('send', 'event', 'Download', 'Notable', fileName);
			if ( typeof fbq === 'function' ){fbq('track', 'ViewContent', {content_name: fileName});}
			nv('event', 'Notable File Download');
		}
	});

	//Generic Interal Search Tracking
	nebula.dom.document.on('submit', '#s, input.search', function(){
		var searchQuery = jQuery.trim(jQuery(this).find('input[name="s"]').val());
		ga('send', 'event', 'Internal Search', 'Submit', searchQuery);
		if ( typeof fbq === 'function' ){fbq('track', 'Search', {search_string: searchQuery});}
		nv('identify', {internal_search: searchQuery});
	});

	//Keyboard Shortcut (Non-interaction because they are not taking explicit action with the webpage)
	nebula.dom.document.on('keydown', function(e){
		//Ctrl+F or Cmd+F (Find)
		if ( (e.ctrlKey || e.metaKey) && e.which === 70 ){
			var highlightedText = jQuery.trim(window.getSelection().toString()) || '(No highlighted text when initiating find)';
			ga('send', 'event', 'Find on Page', 'Ctrl+F', highlightedText, {'nonInteraction': true});
		}

		//Ctrl+D or Cmd+D (Bookmark)
		if ( (e.ctrlKey || e.metaKey) && e.which === 68 ){ //Ctrl+D
			removeQueryParameter(['utm_campaign', 'utm_medium', 'utm_source', 'utm_content', 'utm_term'], window.location.href); //Remove existing UTM parameters
			history.replaceState(null, document.title, window.location.href + '?utm_source=bookmark');
			ga('send', 'event', 'Bookmark', 'Ctrl+D', "User bookmarked the page (with keyboard shortcut)", {'nonInteraction': true});
		}
	});

	//Mailto link tracking
	nebula.dom.document.on('mousedown', 'a[href^="mailto"]', function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', nebula.analytics.dimensions.eventIntent, eventIntent);
		var emailAddress = jQuery(this).attr('href').replace('mailto:', '');
		ga('set', nebula.analytics.dimensions.contactMethod, 'Mailto');
		ga('send', 'event', 'Contact', 'Mailto', emailAddress);
		if ( typeof fbq === 'function' ){if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Mailto'});}}
		nv('event', 'Mailto Click');
		nv('identify', {mailto_contacted: emailAddress});
	});

	//Telephone link tracking
	nebula.dom.document.on('mousedown', 'a[href^="tel"]', function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', nebula.analytics.dimensions.eventIntent, eventIntent);
		var phoneNumber = jQuery(this).attr('href').replace('tel:', '');
		ga('set', nebula.analytics.dimensions.contactMethod, 'Click-to-Call');
		ga('send', 'event', 'Contact', 'Click-to-Call', phoneNumber);
		if ( typeof fbq === 'function' ){if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Click-to-Call'});}}
		nv('event', 'Click-to-Call');
		nv('identify', {phone_contacted: phoneNumber});
	});

	//SMS link tracking
	nebula.dom.document.on('mousedown', 'a[href^="sms"]', function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', nebula.analytics.dimensions.eventIntent, eventIntent);
		var phoneNumber = jQuery(this).attr('href').replace('sms:+', '');
		ga('set', nebula.analytics.dimensions.contactMethod, 'SMS');
		ga('send', 'event', 'Contact', 'SMS', phoneNumber);
		if ( typeof fbq === 'function' ){if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'SMS'});}}
		nv('event', 'SMS');
		nv('identify', {phone_contacted: phoneNumber});
	});

	//Utility Navigation Menu
	nebula.dom.document.on('mousedown', '#utility-nav ul.menu a', function(e){
		ga('send', 'event', 'Navigation Menu', 'Utility Menu', jQuery.trim(jQuery(this).text()));
	});

	//Primary Navigation Menu
	nebula.dom.document.on('mousedown', '#primary-nav ul.menu a', function(e){
		ga('send', 'event', 'Navigation Menu', 'Primary Menu', jQuery.trim(jQuery(this).text()));
	});

	//Mobile Navigation Menu
	nebula.dom.document.on('mousedown', '#mobilenav ul.menu a.mm-listitem__text', function(e){
		ga('send', 'event', 'Navigation Menu', 'Mobile Menu', jQuery.trim(jQuery(this).text()));
	});

	//Breadcrumb Navigation
	nebula.dom.document.on('mousedown', 'ol.nebula-breadcrumbs a', function(e){
		ga('send', 'event', 'Navigation Menu', 'Breadcrumbs', jQuery.trim(jQuery(this).text()));
	});

	//Sidebar Navigation Menu
	nebula.dom.document.on('mousedown', '#sidebar-section ul.menu a', function(e){
		ga('send', 'event', 'Navigation Menu', 'Sidebar Menu', jQuery.trim(jQuery(this).text()));
	});

	//Footer Navigation Menu
	nebula.dom.document.on('mousedown', '#powerfooter ul.menu a', function(e){
		ga('send', 'event', 'Navigation Menu', 'Footer Menu', jQuery.trim(jQuery(this).text()));
	});

	//Non-Linked Click Attempts
	jQuery('img').on('click', function(){
		if ( !jQuery(this).parents('a').length ){
			ga('send', 'event', 'Non-Linked Click Attempt', 'Image', jQuery(this).attr('src'), {'nonInteraction': true});
			nv('event', 'Non-Linked Click Attempt');
		}
	});

	//Skip to Content Link Focus/Clicks
	nebula.dom.document.on('focus', '.sr-only', function(){
		ga('send', 'event', 'Accessibility Links', 'Focus', jQuery(this).text());
	});
	nebula.dom.document.on('click', '.sr-only', function(){
		ga('send', 'event', 'Accessibility Links', 'Click', jQuery(this).text());
	});

	//Video Enter Picture-in-Picture
	nebula.dom.document.on('enterpictureinpicture', 'video', function(e){
		ga('send', 'event', 'Videos', 'Enter Picture-in-Picture', e.target.id, {'nonInteraction': true}); //Non-interaction because this may not be triggered by the user.
	});

	//Video Leave Picture-in-Picture
	nebula.dom.document.on('leavepictureinpicture', 'video', function(e){
		ga('send', 'event', 'Videos', 'Leave Picture-in-Picture', e.target.id, {'nonInteraction': true}); //Non-interaction because this may not be triggered by the user.
	});

	//Word copy tracking
	var copyCount = 0;
	nebula.dom.document.on('cut copy', function(){
		var selection = window.getSelection().toString();
		var words = selection.split(' ');
		wordsLength = words.length;

		//Track Email or Phone copies as contact intent.
		emailPhone = jQuery.trim(words.join(' '));
		if ( nebula.regex.email.test(emailPhone) ){
			ga('set', nebula.analytics.dimensions.contactMethod, 'Mailto');
			ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
			ga('send', 'event', 'Contact', 'Email (Copied)', emailPhone);
			nv('event', 'Email Address Copied');
			nv('identify', {mailto_contacted: emailPhone});
		} else {
			var alphanumPhone = emailPhone.replace(/\W/g, ''); //Keep only alphanumeric characters
			var firstFourNumbers = parseInt(alphanumPhone.substring(0, 4)); //Store the first four numbers as an integer

			//If the first three/four chars are numbers and the full string is either 10 or 11 characters (to capture numbers with words) -or- if it matches the phone RegEx pattern
			if ( (!isNaN(firstFourNumbers) && firstFourNumbers.toString().length >= 3 && (alphanumPhone.length === 10 || alphanumPhone.length === 11)) || nebula.regex.phone.test(emailPhone) ){
				ga('set', nebula.analytics.dimensions.contactMethod, 'Click-to-Call');
				ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
				ga('send', 'event', 'Contact', 'Phone (Copied)', emailPhone);
				nv('event', 'Phone Number Copied');
				nv('identify', {phone_contacted: emailPhone});
			}
		}

		if ( copyCount < 5 ){
			if ( words.length > 8 ){
				words = words.slice(0, 8).join(' ');
				ga('send', 'event', 'Copied Text', words.length + ' words', words + '... [' + wordsLength + ' words]', words.length);
			} else {
				if ( jQuery.trim(selection) === '' ){
					ga('send', 'event', 'Copied Text', '[0 words]');
				} else {
					ga('send', 'event', 'Copied Text', words.length + ' words', selection, words.length);
				}
			}
			nv('event', 'Text Copied');
		}

		copyCount++;
	});

	//AJAX Errors
	nebula.dom.document.ajaxError(function(e, jqXHR, settings, thrownError){
		var errorMessage = thrownError;
		if ( jqXHR.status === 0 ){ //A status of 0 means the error is unknown. Possible network connection issue (like a blocked request).
			errorMessage = 'Unknown error';
		}

		ga('send', 'exception', {'exDescription': '(JS) AJAX Error (' + jqXHR.status + '): ' + errorMessage + ' on ' + settings.url, 'exFatal': true});
		nv('event', 'AJAX Error');
	});

	//Window Errors
	window.onerror = function(message, file, line){
		var errorMessage = message + ' at ' + line + ' of ' + file;
		if ( message.toLowerCase().indexOf('script error') > -1 ){ //If it is a script error
			errorMessage = 'Script error (An error occurred in a script hosted on a different domain)'; //No additional information is available because of the browser's same-origin policy. Use CORS when possible to get additional information.
		}

		ga('send', 'exception', {'exDescription': '(JS) ' + errorMessage, 'exFatal': false}); //Is there a better way to detect fatal vs non-fatal errors?
		nv('event', 'JavaScript Error');
	}

	//Reporting Observer deprecations and interventions
	//@todo Nebula 0: This may be causing "aw snap" errors in Chrome. Disabling for now until the feature is more stable.
/*
	if ( typeof window.ReportingObserver !== 'undefined' ){ //Chrome 68+
		var nebulaReportingObserver = new ReportingObserver(function(reports, observer){
			for ( report of reports ){
				if ( report.body.sourceFile.indexOf('extension') < 0 ){ //Ignore browser extensions
					ga('send', 'exception', {'exDescription': '(JS) Reporting Observer [' + report.type + ']: ' + report.body.message + ' in ' + report.body.sourceFile + ' on line ' + report.body.lineNumber, 'exFatal': false});
				}
			}
		}, {buffered: true});
		nebulaReportingObserver.observe();
	}
*/

	//Capture Print Intent
	if ( 'matchMedia' in window ){ //IE10+
		window.matchMedia('print').addListener(function(media){
			if ( media.matches ){
				sendPrintEvent();
			}
		});
	} else {
		window.onafterprint = sendPrintEvent();
	}
	function sendPrintEvent(){
		ga('set', nebula.analytics.dimensions.eventIntent, 'Intent');
		ga('send', 'event', 'Print', 'Print');
		nv('event', 'Print');
	}

	//Detect Adblock
	if ( nebula.user.client.bot === false && nebula.site.options.adblock_detect ){
		window.performance.mark('nebula_detect_adblock_start');
		jQuery.ajax({
			type: 'GET',
			url: nebula.site.directory.template.uri + '/assets/js/vendor/show_ads.js',
			dataType: 'script',
			cache: true,
			timeout: 5000
		}).done(function(){
			nebula.session.flags.adblock = false;
		}).fail(function(){
			jQuery('html').addClass('ad-blocker');
			ga('set', nebula.analytics.dimensions.blocker, 'Ad Blocker');

			if ( nebula.session.flags.adblock != true ){
				ga('send', 'event', 'Ad Blocker', 'Blocked', 'This user is using ad blocking software.', {'nonInteraction': true}); //Uses an event because it is asynchronous!
				nebula.session.flags.adblock = true;
			}
		}).always(function(){
			window.performance.mark('nebula_detect_adblock_end');
			window.performance.measure('nebula_detect_adblock', 'nebula_detect_adblock_start', 'nebula_detect_adblock_end');
		});
	}

	//DataTables Filter
	nebula.dom.document.on('keyup', '.dataTables_filter input', function (){
		oThis = jQuery(this);
		debounce(function(){
			ga('send', 'event', 'DataTables', 'Search Filter', oThis.val() );
		}, 1000, 'datatables_search_filter');
	});

	//DataTables Sorting
	nebula.dom.document.on('click', 'th.sorting', function(){
		ga('send', 'event', 'DataTables', 'Sort', jQuery(this).text());
	});

	//DataTables Pagination
	nebula.dom.document.on('', 'a.paginate_button ', function(){
		ga('send', 'event', 'DataTables', 'Paginate', jQuery(this).text());
	});

	//DataTables Show Entries
	nebula.dom.document.on('change', '.dataTables_length select', function(){
		ga('send', 'event', 'DataTables', 'Shown Entries Change', jQuery(this).val());
	});
}

//Ecommerce event tracking
//Note: These supplement the plugin Enhanced Ecommerce for WooCommerce
function ecommerceTracking(){
	if ( has(nebula, 'site.ecommerce') && nebula.site.ecommerce ){
		//Add to Cart clicks
		nebula.dom.document.on('click', 'a.add_to_cart, .single_add_to_cart_button', function(){ //@todo "Nebula" 0: is there a trigger from WooCommerce this can listen for?
			ga('send', 'event', 'Ecommerce', 'Add to Cart', jQuery(this).attr('data-product_id'));
			if ( typeof fbq === 'function' ){fbq('track', 'AddToCart');}
			nv('event', 'Ecommerce Add to Cart');
		});

		//Update cart clicks
		nebula.dom.document.on('click', '.button[name="update_cart"]', function(){
			ga('send', 'event', 'Ecommerce', 'Update Cart Button', 'Update Cart button click');
			nv('event', 'Ecommerce Update Cart');
		});

		//Product Remove buttons
		nebula.dom.document.on('click', '.product-remove a.remove', function(){
			ga('send', 'event', 'Ecommerce', 'Remove this item', jQuery(this).attr('data-product_id'));
			nv('event', 'Ecommerce Remove From Cart');
		});

		//Proceed to Checkout
		nebula.dom.document.on('click', '.wc-proceed-to-checkout .checkout-button', function(){
			ga('send', 'event', 'Ecommerce', 'Proceed to Checkout Button', 'Proceed to Checkout button click');
			if ( typeof fbq === 'function' ){fbq('track', 'InitiateCheckout');}
			nv('event', 'Ecommerce Proceed to Checkout');
		});

		//Checkout form timing
		nebula.dom.document.on('click focus', '#billing_first_name', function(){
			nebulaTimer('ecommerce_checkout', 'start');
			ga('send', 'event', 'Ecommerce', 'Started Checkout Form', 'Began filling out the checkout form (Billing First Name)');
			nv('event', 'Ecommerce Started Checkout Form');
		});

		//Place order button
		nebula.dom.document.on('click', '#place_order', function(){
			ga('send', 'timing', 'Ecommerce', 'Checkout Form', Math.round(nebulaTimer('ecommerce_checkout', 'end')), 'Billing details start to Place Order button click');
			ga('send', 'event', 'Ecommerce', 'Place Order Button', 'Place Order button click (likely exit to payment gateway)');
			if ( typeof fbq === 'function' ){fbq('track', 'Purchase');}
			nv('event', 'Ecommerce Placed Order');
			nv('identify', {hs_lifecyclestage_customer_date: 1}); //@todo "Nebula" 0: What kind of date format does Hubspot expect here?
		});
	}
}

//Detect scroll depth
function scrollDepth(){
	if ( window.performance ){ //Safari 11+
		scrollReady = performance.now();

		var scrollDepthHandler = function(){
			once(function(){
				scrollBegin = performance.now()-scrollReady;
				if ( scrollBegin < 250 ){ //Try to avoid autoscrolls
					ga('send', 'event', 'Scroll Depth', 'Began Scrolling', 'Initial scroll started at ' + nebula.dom.body.scrollTop() + 'px', Math.round(scrollBegin), {'nonInteraction': true}); //Event value is time until scrolling.
				}
			}, 'begin scrolling');

			debounce(function(){
				//If user has reached the bottom of the page
				if ( (nebula.dom.window.height()+nebula.dom.window.scrollTop()) >= nebula.dom.document.height() ){
					once(function(){
						scrollEnd = performance.now()-(scrollBegin+scrollReady);
						ga('send', 'event', 'Scroll Depth', 'Entire Page', '', Math.round(scrollEnd), {'nonInteraction': true}); //Event value is time to reach end
						jQuery(window).off('scroll', scrollDepthHandler);
					}, 'end scrolling');
				}
			}, 100, 'scroll depth');
		}
		nebula.dom.window.on('scroll', scrollDepthHandler);
	}
}

//Check if an element is within the viewport
function isInView(element){
	if ( typeof element === 'string' ){
		element = jQuery(element);
	}

	var elementTop = element.offset().top;
	var elementBottom = element.offset().top+element.innerHeight();

	var windowTop = nebula.dom.document.scrollTop();
	var windowBottom = nebula.dom.document.scrollTop()+nebula.dom.window.height();

	if ( !nebula.dom.body.hasClass('page-visibility-hidden') && ((elementTop >= windowTop && elementTop < windowBottom) || (elementBottom >= windowTop && elementBottom < windowBottom) || (elementTop < windowTop && elementBottom > windowBottom)) ){
		return true;
	}

	return false;
}

//Send data to the CRM
function nv(action, data, sendNow){
	if ( navigator.doNotTrack || window.doNotTrack ){
		return false;
	}

	if ( typeof _hsq === 'undefined' ){
		return false;
	}

	if ( !sendNow ){
		var sendNow = true;
	}

	if ( !action || !data || typeof data == 'function' ){
		console.error('Action and Data Object are both required.');
		ga('send', 'exception', {'exDescription': '(JS) Action and Data Object are both required in nv()', 'exFatal': false});
		return false; //Action and Data are both required.
	}

	if ( action === 'identify' ){
		_hsq.push(["identify", data]);

		jQuery.each(data, function(key, value){
			nebula.user[key] = value;
		});

		if ( sendNow ){
			//Send a virtual pageview because event data doesn't work with free Hubspot accounts (and the identification needs a transport method)
			_hsq.push(['setPath', window.location.href.replace(nebula.site.directory.root, '') + '#virtual-pageview/identify']);
			_hsq.push(['trackPageView']);
		}
		//_hsq.push(["trackEvent", data]); //If using an Enterprise Marketing subscription, use this method instead of the trackPageView above

		//Check if email was identified or just supporting data
		if ( 'email' in data ){
			if ( !nebula.user.known && nebula.regex.email.test(data['email']) ){
				ga('send', 'event', 'CRM', 'Contact Identified', "A contact's email address in the CRM has been identified.");
				nebula.user.known = true;
			}
		} else {
			ga('send', 'event', 'CRM', 'Supporting Information', 'Information associated with this user has been identified.');
		}
	}

	if ( action === 'event' ){
		//Hubspot events are only available with an Enterprise Marketing subscription
		//Refer to this documentation for event names and IDs: https://developers.hubspot.com/docs/methods/tracking_code_api/tracking_code_overview#idsandnames
		_hsq.push(["trackEvent", data]);

		_hsq.push(['setPath', window.location.href.replace(nebula.site.directory.root, '') + '#virtual-pageview/' + data]);
		var oldTitle = document.title;
		document.title = document.title + ' (Virtual)';
		_hsq.push(['trackPageView']);
		document.title = oldTitle;
	}

	nebula.dom.document.trigger('nv_data', data);
}

/*==========================
 Search Functions
 ===========================*/

//Search Keywords
//container is the parent container, parent is the individual item, value is usually the input val.
function keywordSearch(container, parent, value, filteredClass){
	if ( !filteredClass ){
		var filteredClass = 'filtereditem';
	}

	if ( value.length > 2 && value.charAt(0) === '/' && value.slice(-1) === '/' ){
		var regex = new RegExp(value.substring(1).slice(0, -1), 'i'); //Convert the string to RegEx after removing the first and last /

		jQuery(parent).addClass(filteredClass);
		jQuery(container).find('*').filter(function(){
			return regex.test(jQuery(this).text());
		}).closest(parent).removeClass(filteredClass);
	} else {
		jQuery(container).find("*:not(:Contains(" + value + "))").closest(parent).addClass(filteredClass);
		jQuery(container).find("*:Contains(" + value + ")").closest(parent).removeClass(filteredClass);
	}
}

//Menu Search Replacement
function menuSearchReplacement(){
	if ( jQuery('.nebula-search').length ){
		var randomMenuSearchID = Math.floor((Math.random()*100)+1);
		jQuery('.menu .nebula-search').html('<form class="wp-menu-nebula-search nebula-search search footer-search" method="get" action="' + nebula.site.home_url + '/"><div class="input-group"><i class="fas fa-search"></i><label class="sr-only" for="nebula-menu-search-' + randomMenuSearchID + '">Search</label><input type="search" id="nebula-menu-search-' + randomMenuSearchID + '" class="nebula-search input search" name="s" placeholder="Search" autocomplete="off" x-webkit-speech /></div></form>');

		jQuery('.nebula-search input').on('focus', function(){
			jQuery(this).addClass('focus active');
		});

		jQuery('.nebula-search input').on('blur', function(){
			if ( jQuery(this).val() === '' || jQuery.trim(jQuery(this).val()).length === 0 ){
				jQuery(this).removeClass('focus active focusError').attr('placeholder', jQuery(this).attr('placeholder'));
			} else {
				jQuery(this).removeClass('active');
			}
		});
	}
}

//Only allow alphanumeric (and some special keys) to return true
//Use inside of a keydown function, and pass the event data.
function searchTriggerOnlyChars(e){
	//@TODO "Nebula" 0: This still allows shortcuts like "cmd+a" to return true.
	var spinnerRegex = new RegExp("^[a-zA-Z0-9]+$");
	var allowedKeys = [8, 46];
	var searchChar = String.fromCharCode(!e.charCode ? e.which : e.charCode);

	if ( spinnerRegex.test(searchChar) || allowedKeys.indexOf(e.which) > -1 ){
		return true;
	} else {
		return false;
	}
}

//Enable autocomplete search on WordPress core selectors
function autocompleteSearchListeners(){
	if ( jQuery('.nebula-search input, input#s, input.search').length ){
		nebulaLoadJS(nebula.site.resources.scripts.nebula_jquery_ui, function(){
			nebula.dom.document.on('blur', '.nebula-search input', function(){
				jQuery('.nebula-search').removeClass('searching').removeClass('autocompleted');
			});

			jQuery('input#s, input.search').on('keyup paste change', function(e){
				if ( !jQuery(this).hasClass('no-autocomplete') && jQuery.trim(jQuery(this).val()).length && searchTriggerOnlyChars(e) ){
					autocompleteSearch(jQuery(this));
				}
			});
		});
		nebulaLoadCSS(nebula.site.resources.styles.nebula_jquery_ui);
	}
}

//Run an autocomplete search on a passes element.
function autocompleteSearch(element, types){
	if ( typeof element === 'string' ){
		element = jQuery(element);
	}

	if ( types && !jQuery.isArray(types) ){
		console.error('autocompleteSearch requires 2nd parameter to be an array.');
		ga('send', 'exception', {'exDescription': '(JS) autocompleteSearch requires 2nd parameter to be an array', 'exFatal': false});
		return false;
	}

	nebula.dom.document.trigger('nebula_autocomplete_search_start', element);
	nebulaTimer('autocompleteSearch', 'start');
	nebulaTimer('autocompleteResponse', 'start');

	if ( jQuery.trim(element.val()).length ){
		if ( jQuery.trim(element.val()).length >= 2 ){
			//Add "searching" class for custom Nebula styled forms
			element.closest('form').addClass('searching');
			setTimeout(function(){
				element.closest('form').removeClass('searching');
			}, 10000);

			//Swap magnifying glass on Bootstrap input-group
			element.closest('.input-group').find('.fa-search').removeClass('fa-search').addClass('fa-spin fa-spinner');
		} else {
			element.closest('form').removeClass('searching');
			element.closest('.input-group').find('.fa-spin').removeClass('fa-spin fa-spinner').addClass('fa-search');
		}

		element.autocomplete({ //jQuery UI dependent
			position: {
				my: "left top-2px",
				at: "left bottom",
				collision: "flip",
			},
			source: function(request, response){
				jQuery.ajax({
					dataType: 'json',
					type: "POST",
					url: nebula.site.ajax.url + '?prps=acs',
					data: {
						nonce: nebula.site.ajax.nonce,
						action: 'nebula_autocomplete_search',
						data: request,
						types: JSON.stringify(types)
					},
					success: function(data){
						nebula.dom.document.trigger('nebula_autocomplete_search_success', data);
						ga('set', nebula.analytics.metrics.autocompleteSearches, 1);
						if ( data ){
							nebula.dom.document.trigger('nebula_autocomplete_search_results', data);
							nebulaAddToCache(data[0].link);
							jQuery.each(data, function(index, value){
								value.label = value.label.replace(/&#038;/g, "\&");
							});
							noSearchResults = '';
						} else {
							nebula.dom.document.trigger('nebula_autocomplete_search_no_results');
							noSearchResults = ' (No Results)';
						}

						debounce(function(){
							ga('send', 'event', 'Internal Search', 'Autocomplete Search' + noSearchResults, request.term);
							if ( typeof fbq === 'function' ){fbq('track', 'Search', {search_string: request.term});}
							nv('identify', {internal_search: request.term});
						}, 1500, 'autocomplete success buffer');

						ga('send', 'timing', 'Autocomplete Search', 'Server Response', Math.round(nebulaTimer('autocompleteSearch', 'lap')), 'Each search until server results');
						response(data);
						element.closest('form').removeClass('searching').addClass('autocompleted');
						element.closest('.input-group').find('.fa-spin').removeClass('fa-spin fa-spinner').addClass('fa-search');
					},
					error: function(XMLHttpRequest, textStatus, errorThrown){
						nebula.dom.document.trigger('nebula_autocomplete_search_error', request.term);
						debounce(function(){
							ga('send', 'exception', {'exDescription': '(JS) Autocomplete AJAX error: ' + textStatus, 'exFatal': false});
							nv('event', 'Autocomplete Search AJAX Error');
						}, 1500, 'autocomplete error buffer');
						element.closest('form').removeClass('searching');
						element.closest('.input-group').find('.fa-spin').removeClass('fa-spin fa-spinner').addClass('fa-search');
					},
					timeout: 60000
				});
			},
			focus: function(event, ui){
				event.preventDefault(); //Prevent input value from changing.
			},
			select: function(event, ui){
				nebula.dom.document.trigger('nebula_autocomplete_search_selected', ui);
				ga('set', nebula.analytics.metrics.autocompleteSearchClicks, 1);
				ga('send', 'event', 'Internal Search', 'Autocomplete Click', ui.item.label);
				ga('send', 'timing', 'Autocomplete Search', 'Until Navigation', Math.round(nebulaTimer('autocompleteSearch', 'end')), 'From first initial search until navigation');
				if ( typeof ui.item.external !== 'undefined' ){
					window.open(ui.item.link, '_blank');
				} else {
					window.location.href = ui.item.link;
				}
			},
			open: function(){
				 element.closest('form').addClass('autocompleted');
				 var heroAutoCompleteDropdown = jQuery('.form-identifier-nebula-hero-search');
				heroAutoCompleteDropdown.css('max-width', element.outerWidth());
			},
			close: function(){
				element.closest('form').removeClass('autocompleted');
			},
			minLength: 3,
		}).data("ui-autocomplete")._renderItem = function(ul, item){
			 thisSimilarity = ( typeof item.similarity !== 'undefined' )? item.similarity.toFixed(1) + '% Match' : '';
			 var listItem = jQuery("<li class='" + item.classes + "' title='" + thisSimilarity + "'></li>").data("item.autocomplete", item).append("<a> " + item.label.replace(/\\/g, '') + "</a>").appendTo(ul);
			 return listItem;
		};
		var thisFormIdentifier = element.closest('form').attr('id') || element.closest('form').attr('name') || element.closest('form').attr('class');
		element.autocomplete("widget").addClass("form-identifier-" + thisFormIdentifier);
	}
}

//Advanced Search
function advancedSearchListeners(){
	var advancedSearchForm = jQuery('#advanced-search-form');

	if ( advancedSearchForm.length ){
		haveAllEvents = 0;

		jQuery('a#metatoggle').on('click', function(){
			jQuery('#advanced-search-meta').toggleClass('active', function(){
				if ( jQuery('#advanced-search-meta').hasClass('active') ){
					setTimeout(function(){
						jQuery('#advanced-search-meta').addClass('finished');
					}, 500);
				} else {
					jQuery('#advanced-search-meta').removeClass('finished');
				}
			});
			return false;
		});

		jQuery('#s').keyup(function(e){
			advancedSearchPrep('Typing...');
			debounce(function(){
				if ( jQuery('#s').val() ){
					ga('send', 'event', 'Internal Search', 'Advanced Search', jQuery('#s').val());
				}
			}, 1500);
		});

		nebula.dom.document.on('change', '#advanced-search-type, #advanced-search-catstags, #advanced-search-author, #advanced-search-date-start, #advanced-search-date-end', function(){
			advancedSearchPrep();
			if ( jQuery('#advanced-search-date-start') ){
				jQuery('#date-end-con').removeClass('hidden');
			} else { //@TODO "Nebula" 0: Not working...
				jQuery('#date-end-con').val('').addClass('hidden');
			}
		});

		//jQueryUI Datepicker
		nebulaLoadJS(nebula.site.resources.scripts.nebula_jquery_ui, function(){
			jQuery('#advanced-search-date-start').datepicker({ //jQuery UI
				dateFormat: "MM d, yy",
				altField: "#advanced-search-date-start-alt",
				altFormat: "@",
				onSelect: function(){
					advancedSearchPrep();
					if ( jQuery('#advanced-search-date-start') ){
						jQuery('#date-end-con').removeClass('hidden');
					} else {
						jQuery('#date-end-con').val('').addClass('hidden');
					}
				}
			});
			jQuery('#advanced-search-date-end').datepicker({ //jQuery UI
				dateFormat: "MM d, yy",
				altField: "#advanced-search-date-end-alt",
				altFormat: "@",
				onSelect: function(){
					advancedSearchPrep();
				}
			});
		});
		nebulaLoadCSS(nebula.site.resources.styles.nebula_jquery_ui);

		//Reset form
		jQuery('.resetfilters').on('click', function(){
			advancedSearchForm[0].reset();
			//@TODO "Nebula" 0: Chosen.js fields need to be reset manually... or something?
			jQuery(this).removeClass('active');
			advancedSearchPrep();
			return false;
		});

		loadMoreEvents = 0;
		jQuery('#load-more-events').on('click', function(){
			if ( typeof globalEventObject === 'undefined' ){
				advancedSearchPrep(10);

				loadMoreEvents = 10;

				jQuery('html, body').animate({
					scrollTop: advancedSearchForm.offset().top-10
				}, 500);

				return false;
			}

			if ( !jQuery(this).hasClass('all-events-loaded') ){
				loadMoreEvents = loadMoreEvents+10;
				advancedSearch(loadMoreEvents);

				jQuery('html, body').animate({
					scrollTop: advancedSearchForm.offset().top-10
				}, 500);
			}

			return false;
		});

		//Load Prev Events
		//@TODO "Nebula" 0: there is a bug here... i think?
		jQuery('#load-prev-events').on('click', function(){
			if ( !jQuery(this).hasClass('no-prev-events') ){
				jQuery('html, body').animate({
					scrollTop: advancedSearchForm.offset().top-10
				}, 500);

				loadMoreEvents = loadMoreEvents-10;
				advancedSearch(loadMoreEvents);
			}

			return false;
		});
	}
}

//Either AJAX for all posts, or search immediately (if in memory)
function advancedSearchPrep(startingAt, waitingText){
	var advancedSearchIndicator = jQuery('#advanced-search-indicator');
	if ( !startingAt || typeof startingAt === 'string' ){
		waitingText = startingAt;
		startingAt = 0;
	}
	if ( haveAllEvents === 0 ){
		if ( !waitingText ){
			waitingText = 'Waiting for filters...';
		}
		advancedSearchIndicator.html('<i class="fas fa-fw fa-keyboard"></i> ' + waitingText);
		debounce(function(){
			advancedSearchIndicator.html('<i class="fas fa-fw fa-spin fa-spinner"></i> Loading posts...');
			jQuery.ajax({
				type: "POST",
				url: nebula.site.ajax.url + '?prps=ads',
				data: {
					nonce: nebula.site.ajax.nonce,
					action: 'nebula_advanced_search',
				},
				success: function(response){
					haveAllEvents = 1;
					advancedSearch(startingAt, response);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown){
					jQuery('#advanced-search-results').text('Error: ' + XMLHttpRequest + ', ' + textStatus + ', ' + errorThrown);
					haveAllEvents = 0;
					ga('send', 'exception', {'exDescription': '(JS) Advanced Search AJAX error: ' + textStatus, 'exFatal': false});
					nv('event', 'Advanced Search AJAX Error');
				},
				timeout: 60000
			});
		}, 1500, 'ajax search debounce');
	} else {
		advancedSearch(startingAt);
	}
}

function advancedSearch(start, eventObject){
	var advancedSearchIndicator = jQuery('#advanced-search-indicator');

	if ( eventObject ){
		globalEventObject = jQuery.parseJSON(eventObject);
	}

	//Search events object
	filteredPostsObject = postSearch(globalEventObject);

	jQuery('#advanced-search-results').html('');
	i = ( start )? parseFloat(start) : 0;
	if ( start !== 0 ){
		jQuery('#load-prev-events').removeClass('no-prev-events');
	} else {
		jQuery('#load-prev-events').addClass('no-prev-events');
	}
	if ( start+10 >= filteredPostsObject.length ){
		var end = filteredPostsObject.length;
		moreEvents(0);
	} else {
		var end = start+10;
		moreEvents(1);
	}

	if ( filteredPostsObject.length > 0 ){
		advancedSearchIndicator.html('<i class="fas fa-fw fa-calendar"></i> Showing <strong>' + (start+1) + '-' + end + '</strong> of <strong>' + filteredPostsObject.length + '</strong> results:');
	} else {
		advancedSearchIndicator.html('<i class="fas fa-fw fa-times-circle"></i> <strong>No pages found</strong> that match your filters.');
		if ( jQuery('#s').val() ){
			ga('send', 'event', 'Internal Search', 'Advanced No Results', jQuery('#s').val());
		}
		moreEvents(0);
		return false;
	}

	while ( i <= end-1 ){
		if ( !filteredPostsObject[i] || typeof filteredPostsObject[i].posted === 'undefined' ){
			moreEvents(0);
			return;
		}

		//Date and Time
		var postDate = new Date(filteredPostsObject[i].posted * 1000);
		var year = postDate.getFullYear();
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
		var month = months[postDate.getMonth()];
		var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var weekday = weekdays[postDate.getDay()];
		var day = postDate.getDate();
		var hour = postDate.getHours();
		var ampm = ( hour >= 12 )? 'pm' : 'am';
		if ( hour > 12 ){
			hour -= 12;
		} else if ( hour === 0 ){
			hour = 12;
		}
		var minute = (( postDate.getMinutes() <= 9 )? '0' : '') + postDate.getMinutes();

		//Categories
		var postCats = '';
		if ( filteredPostsObject[i].categories.length ){
			eventCats = '<span class="post-cats"><i class="fas fa-fw fa-bookmark"></i> ' + filteredPostsObject[i].categories.join(', ') + '</span>';
		}

		//Tags
		var postTags = '';
		if ( filteredPostsObject[i].tags.length ){
			eventTags = '<span class="post-tags"><i class="fas fa-fw fa-tags"></i> ' + filteredPostsObject[i].tags.join(', ') + '</span>';
		}

		//Description
		var shortDescription = '';
		if ( filteredPostsObject[i].description ){
			shortDescription = ( filteredPostsObject[i].description.length > 200 )? filteredPostsObject[i].description.substring(0, 200) + '...' : filteredPostsObject[i].description;
		}

		var markUp = '<div class="advanced-search-result">' +
				'<h3><a href="' + filteredPostsObject[i].url + '">' + filteredPostsObject[i].title + '</a></h3>' +
				'<p class="post-date-time">' + month + ' ' + day + ', ' + year +
				'<p class="post-meta-tags">' + postCats + postTags + '</p>' +
				'<p class="post-meta-description">' + shortDescription + '</p>' +
				'<div class="hidden" style="display: none; visibility: hidden; pointer-events: none;">' + filteredPostsObject[i].custom.nebula_internal_search_keywords + '</div>' +
			'</div>';
		jQuery('#advanced-search-results').append(markUp);
		i++;
	}
}

function postSearch(posts){
	var tempFilteringObject = JSON.parse(JSON.stringify(posts)); //Duplicate the object in memory
	jQuery(tempFilteringObject).each(function(i){
		var thisPost = this;

		//Search Dates
		if ( jQuery.trim(jQuery('#advanced-search-date-start-alt').val()).length ){
			var postDate = new Date(thisPost.posted*1000);
			var postDateStamp = postDate.getFullYear() + '-' + postDate.getMonth() + '-' + postDate.getDate();
			var searchDateStart = new Date(parseInt(jQuery('#advanced-search-date-start-alt').val()));
			var searchDateStartStamp = searchDateStart.getFullYear() + '-' + searchDateStart.getMonth() + '-' + searchDateStart.getDate();

			if ( jQuery.trim(jQuery('#advanced-search-date-end-alt').val()).length ){
				var searchDateEnd = new Date(parseInt(jQuery('#advanced-search-date-end-alt').val()));
				if ( postDate < searchDateStart || postDate > searchDateEnd ){
					delete tempFilteringObject[i]; //Date is not in the range
					return;
				}
			} else {
				if ( postDateStamp !== searchDateStartStamp ){
					delete tempFilteringObject[i]; //Date does not match exactly
					return;
				}
			}
		}

		//Search Categories and Tags
		if ( jQuery.trim(jQuery('#advanced-search-catstags').val()).length ){
			if ( thisPost.categories || thisPost.tags ){
				jQuery.each(jQuery('#advanced-search-catstags').val(), function(key, value){
					thisCatTag = value.split('__');
					if ( thisCatTag[0] === 'category' ){
						var categoryText = thisPost.categories.join(', ').toLowerCase().replace(/&amp;/g, '&');
						if ( categoryText.indexOf(thisCatTag[1].toLowerCase()) < 0 ){
							delete tempFilteringObject[i]; //Category does not match
						}
					} else {
						var tagText = thisPost.tags.join(', ').toLowerCase().replace(/&amp;/g, '&');
						if ( tagText.indexOf(thisCatTag[1].toLowerCase()) < 0 ){
							delete tempFilteringObject[i]; //Tag does not match
						}
					}
				});
			} else {
				delete tempFilteringObject[i]; //Post does not have categories or tags
				return;
			}
		}

		//Search Post Types (This is an inclusive filter)
		if ( jQuery.trim(jQuery('#advanced-search-type').val()).length ){
			var requestedPostType = jQuery('#advanced-search-type').val().join(', ').toLowerCase();
			if ( requestedPostType.indexOf(thisPost.type.toLowerCase()) < 0 ){
				delete tempFilteringObject[i]; //Post Type does not match
			}
		}

		//Search Author
		if ( jQuery.trim(jQuery('#advanced-search-author').val()).length ){
			if ( thisPost.author.id !== jQuery('#advanced-search-author').val() ){
				delete tempFilteringObject[i]; //Author ID does not match
				return;
			}
		}

		//Keyword Filter
		if ( jQuery.trim(jQuery('#s').val()).length ){
			thisEventString = JSON.stringify(thisPost).toLowerCase();
			thisEventString += '';
			if ( thisEventString.indexOf(jQuery('#s').val().toLowerCase()) < 0 ){
				delete tempFilteringObject[i]; //Keyword not found
				return;
			}
		}
	});

	tempFilteringObject = tempFilteringObject.filter(function(){return true;});
	eventFormNeedReset();
	return tempFilteringObject;
}

function wpSearchInput(){
	jQuery('#post-0 #s, #nebula-drawer #s, .search-results #s').focus(); //Automatically focus on specific search inputs

	//Set search value as placeholder
	var searchVal = get('s') || jQuery('#s').val();
	if ( searchVal ){
		jQuery('#s, .nebula-search input').attr('placeholder', searchVal.replace(/\+/g, ' '));
	}
}


//Mobile search placeholder toggle
function mobileSearchPlaceholder(){
	var mobileHeaderSearchInput = jQuery('#mobileheadersearch input');
	var searchPlaceholder = 'What are you looking for?';
	if ( window.matchMedia && window.matchMedia("(max-width: 410px)").matches ){
		searchPlaceholder = 'Search';
	}
	mobileHeaderSearchInput.attr('placeholder', searchPlaceholder);
}


//Search Validator
function searchValidator(){
	jQuery('.input.search').each(function(){
		if ( jQuery(this).val() === '' || jQuery.trim(jQuery(this).val()).length === 0 ){
			jQuery(this).parent().children('.btn.submit').addClass('disallowed');
		} else {
			jQuery(this).parent().children('.btn.submit').removeClass('disallowed').val('Search');
			jQuery(this).parent().find('.input.search').removeClass('focusError');
		}
	});
	jQuery('.input.search').on('focus blur change keyup paste cut',function(e){
		thisPlaceholder = ( jQuery(this).attr('data-prev-placeholder') !== 'undefined' )? jQuery(this).attr('data-prev-placeholder') : 'Search';
		if ( jQuery(this).val() === '' || jQuery.trim(jQuery(this).val()).length === 0 ){
			jQuery(this).parent().children('.btn.submit').addClass('disallowed');
			jQuery(this).parent().find('.btn.submit').val('Go');
		} else {
			jQuery(this).parent().children('.btn.submit').removeClass('disallowed');
			jQuery(this).parent().find('.input.search').removeClass('focusError').prop('title', '').attr('placeholder', thisPlaceholder);
			jQuery(this).parent().find('.btn.submit').prop('title', '').removeClass('notallowed').val('Search');
		}
		if ( e.type === 'paste' ){
			jQuery(this).parent().children('.btn.submit').removeClass('disallowed');
			jQuery(this).parent().find('.input.search').prop('title', '').attr('placeholder', 'Search').removeClass('focusError');
			jQuery(this).parent().find('.btn.submit').prop('title', '').removeClass('notallowed').val('Search');
		}
	})
	jQuery('form.search').submit(function(){
		if ( jQuery(this).find('.input.search').val() === '' || jQuery.trim(jQuery(this).find('.input.search').val()).length === 0 ){
			jQuery(this).parent().find('.input.search').prop('title', 'Enter a valid search term.').attr('data-prev-placeholder', jQuery(this).attr('placeholder')).attr('placeholder', 'Enter a valid search term').addClass('focusError').focus().attr('value', '');
			jQuery(this).parent().find('.btn.submit').prop('title', 'Enter a valid search term.').addClass('notallowed');
			return false;
		} else {
			return true;
		}
	});
}

//Highlight search terms
function searchTermHighlighter(){
	var theSearchTerm = document.URL.split('?s=')[1];
	if ( typeof theSearchTerm !== 'undefined' ){
		var reg = new RegExp("(?![^<]+>)(" + preg_quote(theSearchTerm.replace(/(\+|%22|%20)/g, ' ')) + ")", "ig");
		jQuery('article .entry-title a, article .entry-summary').each(function(i){
			jQuery(this).html(function(i, html){
				return html.replace(reg, '<mark class="searchresultword">$1</mark>');
			});
		});
	}
}

//Emphasize the search Terms
function emphasizeSearchTerms(){
	var theSearchTerm = get('s');
	if ( theSearchTerm ){
		setTimeout(function(){
			var origBGColor = jQuery('.searchresultword').css('background-color');
			jQuery('.searchresultword').each(function(i){
			 	var stallFor = 150 * parseInt(i);
				jQuery(this).delay(stallFor).animate({
					backgroundColor: 'rgba(255, 255, 0, 0.5)',
					borderColor: 'rgba(255, 255, 0, 1)',
				}, 500, 'swing', function(){
					jQuery(this).delay(1000).animate({
						backgroundColor: origBGColor,
					}, 1000, 'swing', function(){
						jQuery(this).addClass('transitionable');
					});
				});
			});
		}, 1000);
	}
}

//Single search result redirection drawer
function singleResultDrawer(){
	var theSearchTerm = get('rs');
	if ( theSearchTerm ){
		theSearchTerm = theSearchTerm.replace(/\%20|\+/g, ' ').replace(/\%22|"|'/g, '');
		jQuery('#searchform input#s').val(theSearchTerm);

		nebula.dom.document.on('click', '#nebula-drawer .close', function(){
			var permalink = jQuery(this).attr('href');
			history.replaceState(null, document.title, permalink);
			jQuery('#nebula-drawer').slideUp();
			return false;
		});
	}
}

//Page Suggestions for 404 or no search results pages using Google Custom Search Engine
function pageSuggestion(){
	if ( nebula.dom.body.hasClass('search-no-results') || nebula.dom.body.hasClass('error404') ){
		if ( has(nebula, 'site.options') && nebula.site.options.nebula_cse_id !== '' && nebula.site.options.nebula_google_browser_api_key !== '' ){
			if ( get().length ){
				var queryStrings = get();
			} else {
				var queryStrings = [''];
			}
			var path = window.location.pathname;
			var phrase = decodeURIComponent(jQuery.trim(path.replace(/\/+/g, ' '))) + ' ' + decodeURIComponent(jQuery.trim(queryStrings[0].replace(/\+/g, ' ')));
			tryGCSESearch(phrase);
		}

		nebula.dom.document.on('mousedown', 'a.gcse-suggestion, a.internal-suggestion', function(e){
			eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
			ga('set', nebula.analytics.dimensions.eventIntent, eventIntent);

			if ( jQuery(this).hasClass('internal-suggestion') ){
				var suggestionType = 'Internal';
			} else {
				var suggestionType = 'GCSE';
			}

			ga('send', 'event', 'Page Suggestion', suggestionType, jQuery(this).text());
			nv('event', 'Page Suggestion Click');
		});

	}

}

function tryGCSESearch(phrase){
	if ( nebula.site.options.nebula_cse_id.length && nebula.site.options.nebula_google_browser_api_key.length ){
		var queryParams = {
			cx: nebula.site.options.nebula_cse_id,
			key: nebula.site.options.nebula_google_browser_api_key,
			num: 10,
			q: phrase,
			alt: 'JSON'
		}
		var API_URL = 'https://www.googleapis.com/customsearch/v1?';

		// Send the request to the custom search API
		jQuery.getJSON(API_URL, queryParams, function(response){
			if ( response.items && response.items.length ){
				if ( response.items[0].link !== window.location.href ){
					showSuggestedGCSEPage(response.items[0].title, response.items[0].link);
				}
			}
		});
	}
}

function showSuggestedGCSEPage(title, url){
	var hostname = new RegExp(location.host);
	if ( hostname.test(url) ){
		jQuery('.gcse-suggestion').attr('href', url).text(title);
		jQuery('#nebula-drawer.suggestedpage').slideDown();
		nebulaAddToCache(url);
	}
}


/*==========================
 Contact Form Functions
 ===========================*/

function cf7Functions(){
	if ( !jQuery('.wpcf7-form').length ){
		return false;
	}

	jQuery('.wpcf7-form p:empty').remove(); //Remove empty <p> tags within CF7 forms

	formStarted = {};

	//Replace submit input with a button so a spinner icon can be used instead of the CF7 spin gif (unless it has the class "no-button")
	jQuery('.wpcf7-form input[type=submit]').each(function(){
		if ( !jQuery(this).hasClass('no-button') ){
			jQuery('.wpcf7-form input[type=submit]').replaceWith('<button id="submit" type="submit" class="' + jQuery('.wpcf7-form input[type=submit]').attr('class') + '">' + jQuery('.wpcf7-form input[type=submit]').val() + '</button>');
		}
	});

	//Track CF7 forms when they scroll into view (Autotrack). Currently not possible to change category/action/label for just these impressions.
	jQuery('.wpcf7-form').each(function(){
		ga('impressionTracker:observeElements', [{
			'id': jQuery(this).closest('.wpcf7').attr('id') || jQuery(this).attr('id'),
			'threshold': 0.25,
			'fieldsObj': { //@todo "Nebula" 0: The fieldsObj doesn't appear to be supported in programmatic impression tracking via Autotrack
				'eventCategory': 'CF7 Form', //This doesn't do anything right now. There is a task that is modifying the category in inc/analytics.php (but I'd prefer it be here instead)
			},
		}]);
	});

	//Re-init forms inside Bootstrap modals (to enable AJAX submission)
	nebula.dom.document.on('shown.bs.modal', function(e){
		if ( typeof wpcf7.initForm === 'function' && jQuery(e.target).find('.wpcf7-form').length ){
			wpcf7.initForm(jQuery(e.target).find('.wpcf7-form'));
		}
	});

	//For starts and field focuses
	nebula.dom.document.on('focus', '.wpcf7-form input, .wpcf7-form button, .wpcf7-form textarea', function(e){
		formID = jQuery(this).closest('div.wpcf7').attr('id');

		thisField = e.target.name || jQuery(this).closest('.form-group').find('label').text() || e.target.id || 'Unknown';
		var fieldInfo = '';
		if ( jQuery(this).attr('type') === 'checkbox' || jQuery(this).attr('type') === 'radio' ){
			fieldInfo = jQuery(this).attr('value');
		}

		if ( !jQuery(this).hasClass('.ignore-form') && !jQuery(this).find('.ignore-form').length && !jQuery(this).parents('.ignore-form').length ){
			//Form starts
			if ( typeof formStarted[formID] === 'undefined' || !formStarted[formID] ){
				ga('set', nebula.analytics.metrics.formStarts, 1);
				ga('send', 'event', 'CF7 Form', 'Started Form (Focus)', 'Began filling out form ID: ' + formID + ' (' + thisField + ')');
				nv('identify', {'form_contacted': 'CF7 (' + formID + ') Started'}, false);
				nv('event', 'Contact Form (' + formID + ') Started (' + thisField + ')');
				formStarted[formID] = true;
			}

			updateFormFlow(formID, thisField, fieldInfo);

			//Track each individual field focuses
			if ( !jQuery(this).is('button') ){
				ga('send', 'event', 'CF7 Form', 'Individual Field Focused', 'Focus into ' + thisField + ' (Form ID: ' + formID + ')');
			}
		}

		nebulaTimer(formID, 'start', thisField);

		//Individual form field timings
		if ( typeof nebula.timings[formID] !== 'undefined' && typeof nebula.timings[formID].lap[nebula.timings[formID].laps-1] !== 'undefined' ){
			var labelText = '';
			if ( jQuery(this).parent('.label') ){
				labelText = jQuery(this).parent('.label').text();
			} else if ( jQuery('label[for="' + jQuery(this).attr('id') + '"]').length ){
				labelText = jQuery('label[for="' + jQuery(this).attr('id') + '"]').text();
			} else if ( jQuery(this).attr('placeholder').length ){
				labelText = ' "' + jQuery(this).attr('placeholder') + '"';
			}
			ga('send', 'timing', 'CF7 Form', nebula.timings[formID].lap[nebula.timings[formID].laps-1].name + labelText + ' (Form ID: ' + formID + ')', Math.round(nebula.timings[formID].lap[nebula.timings[formID].laps-1].duration), 'Amount of time on this input field (until next focus or submit).');
		}
	});

	//CF7 before submission
	nebula.dom.document.on('wpcf7beforesubmit', function(e){
		jQuery(e.target).find('button#submit').addClass('active');
	});

	//CF7 Invalid (CF7 AJAX response after invalid form)
	nebula.dom.document.on('wpcf7invalid', function(e){
		var formID = e.detail.contactFormId || e.detail.id;
		var formTime = nebulaTimer(e.detail.id, 'lap', 'wpcf7-submit-spam');

		//Apply Bootstrap validation classes to invalid fields
		jQuery('.wpcf7-not-valid').each(function(){
			jQuery(this).addClass('is-invalid');
		});

		updateFormFlow(formID, '[Invalid]');
		ga('set', nebula.analytics.dimensions.contactMethod, 'CF7 Form (Invalid)');
		ga('set', nebula.analytics.dimensions.formTiming, millisecondsToString(formTime) + 'ms (' + nebula.timings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Invalid)', 'Form validation errors occurred on form ID: ' + formID);
		ga('send', 'exception', {'exDescription': '(JS) Invalid form submission for form ID ' + formID, 'exFatal': false});
		nebulaScrollTo(jQuery(".wpcf7-not-valid").first()); //Scroll to the first invalid input
		nv('identify', {'form_contacted': 'CF7 (' + formID + ') Invalid'}, false);
		nv('event', 'Contact Form (' + formID + ') Invalid');
	});

	//General HTML5 validation errors
	jQuery('.wpcf7-form input').on('invalid', function(){ //Would it be more useful to capture all inputs (rather than just CF7)? How would we categorize this in GA?
		debounce(function(){
			updateFormFlow(formID, '[HTML5 Validation Error]');
			ga('send', 'event', 'CF7 Form', 'Submit (Invalid)', 'General HTML5 validation error');
			nv('identify', {'form_contacted': 'CF7 HTML5 Validation Error'});
		}, 50, 'invalid form');
	});

	//CF7 Spam (CF7 AJAX response after spam detection)
	nebula.dom.document.on('wpcf7spam', function(e){
		var formID = e.detail.contactFormId || e.detail.id;
		var formTime = nebulaTimer(e.detail.id, 'end');
		updateFormFlow(formID, '[Spam]');
		ga('set', nebula.analytics.dimensions.contactMethod, 'CF7 Form (Spam)');
		ga('set', nebula.analytics.dimensions.formTiming, millisecondsToString(formTime) + 'ms (' + nebula.timings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Spam)', 'Form submission failed spam tests on form ID: ' + formID);
		ga('send', 'exception', {'exDescription': '(JS) Spam form submission for form ID ' + formID, 'exFatal': false});
		nv('identify', {'form_contacted': 'CF7 (' + formID + ') Submit Spam'}, false);
		nv('event', 'Contact Form (' + formID + ') Spam');
	});

	//CF7 Mail Send Failure (CF7 AJAX response after mail failure)
	nebula.dom.document.on('wpcf7mailfailed', function(e){
		var formID = e.detail.contactFormId || e.detail.id;
		var formTime = nebulaTimer(e.detail.id, 'end');
		updateFormFlow(formID, '[Failed]');
		ga('set', nebula.analytics.dimensions.contactMethod, 'CF7 Form (Failed)');
		ga('set', nebula.analytics.dimensions.formTiming, millisecondsToString(formTime) + 'ms (' + nebula.timings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Failed)', 'Form submission email send failed for form ID: ' + formID);
		ga('send', 'exception', {'exDescription': '(JS) Mail failed to send for form ID ' + formID, 'exFatal': true});
		nv('identify', {'form_contacted': 'CF7 (' + formID + ') Submit Failed'}, false);
		nv('event', 'Contact Form (' + formID + ') Failed');
	});

	//CF7 Mail Sent Success (CF7 AJAX response after submit success)
	nebula.dom.document.on('wpcf7mailsent', function(e){
		formStarted[e.detail.id] = false; //Reset abandonment tracker for this form.

		var formID = e.detail.contactFormId || e.detail.id;
		var formTime = nebulaTimer(e.detail.id, 'end');
		updateFormFlow(formID, '[Success]');
		if ( !jQuery('#' + e.detail.id).hasClass('.ignore-form') && !jQuery('#' + e.detail.id).find('.ignore-form').length && !jQuery('#' + e.detail.id).parents('.ignore-form').length ){
			ga('set', nebula.analytics.metrics.formSubmissions, 1);
		}
		ga('set', nebula.analytics.dimensions.contactMethod, 'CF7 Form (Success)');
		ga('set', nebula.analytics.dimensions.formTiming, millisecondsToString(formTime) + 'ms (' + nebula.timings[e.detail.id].laps + ' inputs)');
		ga('send', 'timing', 'CF7 Form', 'Form Completion (ID: ' + formID + ')', Math.round(formTime), 'Initial form focus until valid submit');
		ga('send', 'event', 'CF7 Form', 'Submit (Success)', 'Form ID: ' + formID);
		if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Form Submit (Success)'});}
		nv('identify', {'form_contacted': 'CF7 (' + formID + ') Submit Success'}, false);
		nv('event', 'Contact Form (' + formID + ') Submit Success');

		//Clear localstorage on submit success
		jQuery('#' + e.detail.id + ' .wpcf7-textarea, #' + e.detail.id + ' .wpcf7-text').each(function(){
			jQuery(this).trigger('keyup'); //Clear validation
			localStorage.removeItem('cf7_' + jQuery(this).attr('name'));
		});
	});

	//CF7 Submit (CF7 AJAX response after any submit attempt). This triggers after the other submit triggers.
	nebula.dom.document.on('wpcf7submit', function(e){
		var formID = e.detail.contactFormId || e.detail.id;
		var formTime = nebulaTimer(e.detail.id, 'lap', 'wpcf7-submit-attempt');

		ga('set', nebula.analytics.dimensions.contactMethod, 'CF7 Form (Attempt)');
		ga('set', nebula.analytics.dimensions.formTiming, millisecondsToString(formTime) + 'ms (' + nebula.timings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Attempt)', 'Submission attempt for form ID: ' + formID); //This event is required for the notable form metric!
		if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Form Submit (Attempt)'});}
		nv('identify', {'form_contacted': 'CF7 (' + formID + ') Submit Attempt'}, false);

		jQuery('#' + e.detail.id).find('button#submit').removeClass('active');
		jQuery('.invalid-feedback').addClass('hidden');
	});
}

function updateFormFlow(formID, field, info){
	if ( typeof formFlow === 'undefined' ){
		formFlow = {};
	}

	if ( !info ){
		info = '';
	} else {
		info = ' (' + info + ')';
	}

	if ( !formFlow[formID] ){
		formFlow[formID] = field + info;
	} else {
		formFlow[formID] += ' > ' + field + info;
	}

	ga('set', nebula.analytics.dimensions.formFlow, formFlow[formID]); //Update form field history. scope: session
}

//Enable localstorage on CF7 text inputs and textareas
function cf7LocalStorage(){
	if ( !jQuery('.wpcf7-form').length || jQuery('.ie, .internet_explorer').length ){
		return false;
	}

	jQuery('.wpcf7-textarea, .wpcf7-text').each(function(){
		var thisLocalStorageVal = localStorage.getItem('cf7_' + jQuery(this).attr('name'));

		//Fill textareas with localstorage data on load
		if ( !jQuery(this).hasClass('do-not-store') && !jQuery(this).hasClass('.wpcf7-captchar') && thisLocalStorageVal && thisLocalStorageVal !== 'undefined' && thisLocalStorageVal !== '' ){
			if ( jQuery(this).val() === '' ){ //Don't overwrite a field that already has text in it!
				jQuery(this).val(thisLocalStorageVal).trigger('keyup');
			}
			jQuery(this).blur();
		} else {
			localStorage.removeItem('cf7_' + jQuery(this).attr('name')); //Remove localstorage if it is undefined or inelligible
		}

		//Update localstorage data
		jQuery(this).on('keyup blur', function(){
			if ( !jQuery(this).hasClass('do-not-store') && !jQuery(this).hasClass('.wpcf7-captchar') ){
				localStorage.setItem('cf7_' + jQuery(this).attr('name'), jQuery(this).val());
			}
		});
	});

	//Update matching form fields on other windows/tabs
	nebula.dom.window.on('storage', function(e){ //This causes an infinite loop in IE11
		jQuery('.wpcf7-textarea, .wpcf7-text').each(function(){
			if ( !jQuery(this).hasClass('do-not-store') && !jQuery(this).hasClass('.wpcf7-captchar') ){
				jQuery(this).val(localStorage.getItem('cf7_' + jQuery(this).attr('name'))).trigger('keyup');
			}
		});
	});

	//Clear localstorage when AJAX submit fails (but submit still succeeds)
	if ( window.location.hash.indexOf('wpcf7') > 0 ){
		if ( jQuery(window.location.hash + ' .wpcf7-mail-sent-ok').length ){
			 jQuery(window.location.hash + ' .wpcf7-textarea, ' + window.location.hash + ' .wpcf7-text').each(function(){
				localStorage.removeItem('cf7_' + jQuery(this).attr('name'));
				jQuery(this).val('').trigger('keyup');
			});
		}
	}
}

//Form live (soft) validator
function nebulaLiveValidator(){
	//Standard text inputs and select menus
	nebula.dom.document.on('keyup change blur', '.nebula-validate-text, .nebula-validate-textarea, .nebula-validate-select', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( jQuery.trim(jQuery(this).val()).length ){
			applyValidationClasses(jQuery(this), 'valid', false);
		} else {
			applyValidationClasses(jQuery(this), 'invalid', ( e.type !== 'keyup' ));
		}
	});

	//RegEx input
	nebula.dom.document.on('keyup change blur', '.nebula-validate-regex', function(e){
		var pattern = new RegExp(jQuery(this).attr('pattern'), 'i');

		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( pattern.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'valid', false);
		} else {
			applyValidationClasses(jQuery(this), 'invalid', ( e.type !== 'keyup' ));
		}
	});

	//URL inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-url', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( nebula.regex.url.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'valid', false);
		} else {
			applyValidationClasses(jQuery(this), 'invalid', ( e.type !== 'keyup' ));
		}
	});

	//Email address inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-email', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( nebula.regex.email.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'valid', false);
		} else {
			applyValidationClasses(jQuery(this), 'invalid', ( e.type !== 'keyup' ));
		}
	});

	//Phone number inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-phone', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( nebula.regex.phone.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'valid', false);
		} else {
			applyValidationClasses(jQuery(this), 'invalid', ( e.type !== 'keyup' ));
		}
	});

	//Date inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-date', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( nebula.regex.date.mdy.test(jQuery(this).val()) ){ //Check for MM/DD/YYYY (and flexible variations)
			applyValidationClasses(jQuery(this), 'valid', false);
		} else if ( nebula.regex.date.ymd.test(jQuery(this).val()) ){ //Check for YYYY/MM/DD (and flexible variations)
			applyValidationClasses(jQuery(this), 'valid', false);
		} else if ( strtotime(jQuery(this).val()) && strtotime(jQuery(this).val()) > -2208988800 ){ //Check for textual dates (after 1900)
			applyValidationClasses(jQuery(this), 'valid', false);
		} else {
			applyValidationClasses(jQuery(this), 'invalid', ( e.type !== 'keyup' ));
		}
	});

	//Checkbox and Radio
	nebula.dom.document.on('change blur', '.nebula-validate-checkbox, .nebula-validate-radio', function(e){
		if ( jQuery(this).closest('.form-group').find('input:checked').length ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else {
			applyValidationClasses(jQuery(this), 'invalid', true);
		}
	});

	//Highlight empty required fields when focusing/hovering on submit button
	jQuery(document).on('mouseover focus', 'form [type="submit"], form #submit', function(){ //Must be deferred because Nebula replaces CF7 submit inputs with buttons
		var invalidCount = 0;

		jQuery(this).closest('form').find('[required], .wpcf7-validates-as-required').each(function(){
			if ( jQuery.trim(jQuery(this).val()).length == 0 ){
				jQuery(this).addClass('nebula-empty-required');
				invalidCount++;
			}
		});

		if ( invalidCount > 0 ){
			var invalidCountText = ( invalidCount === 1 )? ' invalid field remains' : ' invalid fields remain';
			jQuery('form [type="submit"], form #submit').attr('title', invalidCount + invalidCountText);
		}
	});
	jQuery(document).on('mouseout blur', 'form [type="submit"], form #submit', function(){ //Must be deferred because Nebula replaces CF7 submit inputs with buttons
		jQuery(this).closest('form').find('.nebula-empty-required').removeClass('nebula-empty-required');
		jQuery('form [type="submit"], form #submit').removeAttr('title');
	});
}

//Apply Bootstrap appropriate validation classes to appropriate elements
function applyValidationClasses(element, validation, showFeedback){
	if ( typeof element === 'string' ){
		element = jQuery(element);
	} else if ( typeof element !== 'object' ) {
		return false;
	}

	if ( validation === 'success' || validation === 'valid' ){
		element.removeClass('wpcf7-not-valid is-invalid').addClass('is-valid').parent().find('.wpcf7-not-valid-tip').remove();
	} else if ( validation === 'danger' || validation === 'error' || validation === 'invalid' ){
		element.removeClass('wpcf7-not-valid is-valid').addClass('is-invalid');
	} else if ( validation === 'reset' || validation === 'remove' ){
		element.removeClass('wpcf7-not-valid is-invalid is-valid').parent().find('.wpcf7-not-valid-tip').remove();
	}

	//Find the invalid feedback element (if it exists)
	var feedbackElement = false;
	if ( element.parent().find('.invalid-feedback').length ){
		feedbackElement = element.parent().find('.invalid-feedback');
	} else if ( element.closest('.form-group').find('.invalid-feedback').length ){
		feedbackElement = element.closest('.form-group').find('.invalid-feedback');
	}

	if ( feedbackElement ){
		if ( validation === 'feedback' || showFeedback ){
			feedbackElement.removeClass('hidden').show();
		} else {
			feedbackElement.addClass('hidden').hide();
			//element.removeClass('wpcf7-not-valid is-invalid is-valid').parent().find('.wpcf7-not-valid-tip').remove(); //What was this doing?
		}
	}
}


/*==========================
 Optimization Functions
 ===========================*/

//Lazy load images, styles, and JavaScript assets
function lazyLoadAssets(){
	lazyLoadHTML();

	//Lazy load CSS assets
	jQuery.each(nebula.site.resources.lazy.styles, function(handle, condition){
		if ( condition === 'all' || jQuery(condition).length ){
			if ( nebula.site.resources.styles[handle.replace('-', '_')] ){ //If that handle exists in the registered styles
				nebulaLoadCSS(nebula.site.resources.styles[handle.replace('-', '_')]);
			}
		}
	});

	//Lazy load JS assets
	jQuery.each(nebula.site.resources.lazy.scripts, function(handle, condition){
		if ( condition === 'all' || jQuery(condition).length ){
			if ( nebula.site.resources.scripts[handle.replace('-', '_')] ){ //If that handle exists in the registered scripts
				nebulaLoadJS(nebula.site.resources.scripts[handle.replace('-', '_')]);
			}
		}
	});

	//Load Mmenu if trigger exists
	if ( jQuery('.mobilenavtrigger').length ){
		nebulaLoadJS(nebula.site.resources.scripts.nebula_mmenu, function(){
			mmenus();
		});
		nebulaLoadCSS(nebula.site.resources.styles.nebula_mmenu);
	}

	//Load the Google Maps API if 'googlemap' class exists
	if ( jQuery('.googlemap').length ){
		if ( typeof google == "undefined" || !has(google, 'maps') ){ //If the API has not already been called
			nebulaLoadJS('https://www.google.com/jsapi?key=' + nebula.site.options.nebula_google_browser_api_key, function(){ //May not need key here, but just to be safe.
				google.load('maps', '3', {
					other_params: 'libraries=places&key=' + nebula.site.options.nebula_google_browser_api_key,
					callback: function(){
						nebula.dom.document.trigger('nebula_google_maps_api_loaded');
					}
				});
			});
		} else {
			nebula.dom.document.trigger('nebula_google_maps_api_loaded'); //Already loaded
		}
	}

	//Only load Chosen library if 'chosen-select' class exists.
	if ( jQuery('.chosen-select').length ){
		nebulaLoadJS(nebula.site.resources.scripts.nebula_chosen, function(){
			chosenSelectOptions();
		});
		nebulaLoadCSS(nebula.site.resources.styles.nebula_chosen);
	}

	//Only load dataTables library if dataTables table exists.
	if ( jQuery('.dataTables_wrapper').length ){
		nebulaLoadJS(nebula.site.resources.scripts.nebula_datatables, function(){
			nebulaLoadCSS(nebula.site.resources.styles.nebula_datatables);
			dataTablesActions(); //Once loaded, call the DataTables actions. This can be called or overwritten in main.js (or elsewhere)
			nebula.dom.document.trigger('nebula_datatables_loaded'); //This event can be listened for in main.js (or elsewhere) for when DataTables has finished loading.
		});
	}

	if ( jQuery('pre.nebula-code, pre.nebula-code').length ){
		nebulaLoadCSS(nebula.site.resources.styles.nebula_pre);
		nebulaPre();
	}
}

//Load a JavaScript resource (and cache it)
function nebulaLoadJS(url, callback){
	if ( typeof url === 'string' ){
		jQuery.ajax({
			type: 'GET',
			url: url,
			success: function(response){
				if ( callback ){
					callback(response);
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				ga('send', 'exception', {'exDescription': '(JS) ' + url + ' could not be loaded', 'exFatal': false});
				nv('event', 'JavaScript resource could not be dynamically loaded');
			},
			dataType: 'script',
			cache: true,
			timeout: 60000
		});
	} else {
		console.error('nebulaLoadJS requires a valid URL.');
	}
}

//Dynamically load CSS files using JS
//If JavaScript is disabled, these are loaded via <noscript> tags
function nebulaLoadCSS(url){
	if ( typeof url === 'string' ){
		jQuery('head').append('<link rel="stylesheet" href="' + url + '" type="text/css" media="screen">');
	} else {
		console.error('nebulaLoadCSS requires a valid URL. The requested URL is invalid:', url);
	}
}

//Load the lazy loaded HTML
function lazyLoadHTML(){
	//Load any images/iframe inside the viewport
	jQuery('noscript.nebula-lazy').each(function(){
		//If the element is above the fold load it immediately
		if ( jQuery(this).prev('.nebula-lazy-position').offset().top < nebula.dom.window.height() ){
			jQuery(this).prev('.nebula-lazy-position').remove();

			//The actual lazy loaded element as a jQuery object
			var thisContent = jQuery(jQuery(this).text()).on('load loadeddata', function(){
				nebulaLazyVideoTracking(jQuery(this));
			});

			jQuery(this).replaceWith(thisContent); //Remove the <noscript> tag to reveal the img/iframe tag
		}
	});

	jQuery('.nebula-lazy-position').remove(); //These are no longer needed after initial load

	svgImgs();

	//Background Images
	jQuery('.lazy-load').each(function(){
		if ( jQuery(this).offset().top < nebula.dom.window.height() ){
			jQuery(this).removeClass('lazy-load').addClass('lazy-loaded');
		}
	});

	//Wait for a scroll event to load the rest (use var so it can be turned off)
	var loadLazyElements = function(){
		jQuery('noscript.nebula-lazy').each(function(){
			//The actual lazy loaded element as a jQuery object
			var thisContent = jQuery(jQuery(this).text()).on('load loadeddata', function(){
				nebulaLazyVideoTracking(jQuery(this));
			});

			jQuery(this).replaceWith(thisContent); //Remove the <noscript> tag to reveal the img/iframe tag
		});

		svgImgs();

		jQuery('.lazy-load').removeClass('lazy-load').addClass('lazy-loaded'); //Load background images

		//Stop listening for load triggers
		jQuery(window).off('scroll', loadLazyElements);
	};

	//Load the rest of the files on scroll (or if the page loads pre-scrolled)
	nebula.dom.window.on('scroll', loadLazyElements);
	nebula.dom.window.on('nebula_load', loadLazyElements); //This listener does not get turned off.
	if ( jQuery(window).scrollTop() > 200 ){
		loadLazyElements();
	}

	//Also trigger lazy load after any AJAX success. No "off" here because lazy load items could be inside of the AJAX response.
	nebula.dom.document.ajaxSuccess(function(){
		loadLazyElements();
	});
}

/* ==========================================================================
   Google Maps Functions
   ========================================================================== */

//Places - Address Autocomplete
//This uses the Google Maps Geocoding API
//The passed selector must be an input element
function nebulaAddressAutocomplete(autocompleteInput, uniqueID){
	if ( jQuery(autocompleteInput).length && jQuery(autocompleteInput).is('input') ){ //If the addressAutocomplete ID exists
		if ( !uniqueID ){
			uniqueID = 'unnamed';
		}

		if ( typeof google != "undefined" && has(google, 'maps') ){
			googleAddressAutocompleteCallback(autocompleteInput, uniqueID);
		} else {
			//Log all instances to be called after the maps JS library is loaded. This prevents the library from being loaded multiple times.
			if ( typeof autocompleteInputs === 'undefined' ){
				autocompleteInputs = {};
			}
			autocompleteInputs[uniqueID] = autocompleteInput;

			debounce(function(){
				nebulaLoadJS('https://www.google.com/jsapi?key=' + nebula.site.options.nebula_google_browser_api_key, function(){ //May not need key here, but just to be safe.
					google.load('maps', '3', {
						other_params: 'libraries=places&key=' + nebula.site.options.nebula_google_browser_api_key,
						callback: function(){
							jQuery.each(autocompleteInputs, function(uniqueID, input){
								googleAddressAutocompleteCallback(input, uniqueID);
							});
						}
					});
				});
			}, 100, 'google maps script load');
		}
	}
}

function googleAddressAutocompleteCallback(autocompleteInput, uniqueID){
	if ( typeof uniqueID === 'undefined' || uniqueID === 'undefined' ){
		uniqueID = 'unnamed';
	}

	window[uniqueID] = new google.maps.places.Autocomplete(
		jQuery(autocompleteInput)[0],
		{types: ['geocode']} //Restrict the search to geographical location types
	);

	google.maps.event.addListener(window[uniqueID], 'place_changed', function(){ //When the user selects an address from the dropdown, populate the address fields in the form.
		place = window[uniqueID].getPlace(); //Get the place details from the window[uniqueID] object.
		simplePlace = sanitizeGooglePlaceData(place, uniqueID);

		nebula.dom.document.trigger('nebula_address_selected', [place, simplePlace, jQuery(autocompleteInput)]);
		ga('set', nebula.analytics.dimensions.contactMethod, 'Autocomplete Address');
		ga('send', 'event', 'Contact', 'Autocomplete Address', simplePlace.city + ', ' + simplePlace.state.abbr + ' ' + simplePlace.zip.code);

		nv('identify', {
			'street_number': simplePlace.street.number,
			'street_name': simplePlace.street.name,
			'street_full': simplePlace.street.full,
			'city': simplePlace.city,
			'county': simplePlace.county,
			'state': simplePlace.state.name,
			'country': simplePlace.country.name,
			'zip': simplePlace.zip.code,
			'address': simplePlace.street.full + ', ' + simplePlace.city + ', ' + simplePlace.state.abbr + ' ' + simplePlace.zip.code
		});
	});

	jQuery(autocompleteInput).on('focus', function(){
		if ( nebula.site.protocol === 'https' && navigator.geolocation ){
			navigator.geolocation.getCurrentPosition(function(position){ //Bias to the user's geographical location.
				var geolocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				var circle = new google.maps.Circle({
					center: geolocation,
					radius: position.coords.accuracy
				});
				window[uniqueID].setBounds(circle.getBounds());
			});
		}
	}).on('keydown', function(e){
		if ( e.which === 13 && jQuery('.pac-container:visible').length ){ //Prevent form submission when enter key is pressed while the "Places Autocomplete" container is visbile
			return false;
		}
	});

	if ( autocompleteInput === '#address-autocomplete' ){
		nebula.dom.document.on('nebula_address_selected', function(){
			//do any default stuff here.
		});
	}
}

//Organize the Google Place data into an organized (and named) object
//Use uniqueID to name places like "home", "mailing", "billing", etc.
function sanitizeGooglePlaceData(place, uniqueID){
	if ( !place ){
		console.error('Place data is required for sanitization.');
		return false;
	}

	if ( !uniqueID ){
		uniqueID = 'unnamed';
	}

	if ( typeof nebula.user.address === 'undefined' ){
		nebula.user.address = {};
	}

	if ( typeof nebula.user.address !== 'array' ){
		nebula.user.address = [];
	}

	nebula.user.address[uniqueID] = {
		street: {
			number: null,
			name: null
		},
		city: null,
		county: null,
		state: {
			name: null,
			abbr: null
		},
		country: {
			name: null,
			abbr: null
		},
		zip: {
			code: null,
			suffix: null
		}
	};

	for ( var i = 0; i < place.address_components.length; i++ ){
		//Lots of different address types. This function uses only the common ones: https://developers.google.com/maps/documentation/geocoding/#Types
		switch ( place.address_components[i].types[0] ){
			case "street_number":
				nebula.user.address[uniqueID].street.number = place.address_components[i].short_name; //123
				break;
			case "route":
				nebula.user.address[uniqueID].street.name = place.address_components[i].long_name; //Street Name Rd.
				break;
			case "locality":
				nebula.user.address[uniqueID].city = place.address_components[i].long_name; //Liverpool
				break;
			case "administrative_area_level_2":
				nebula.user.address[uniqueID].county = place.address_components[i].long_name; //Onondaga County
				break;
			case "administrative_area_level_1":
				nebula.user.address[uniqueID].state.name = place.address_components[i].long_name; //New York
				nebula.user.address[uniqueID].state.abbr = place.address_components[i].short_name; //NY
				break;
			case "country":
				nebula.user.address[uniqueID].country.name = place.address_components[i].long_name; //United States
				nebula.user.address[uniqueID].country.abbr = place.address_components[i].short_name; //US
				break;
			case "postal_code":
				nebula.user.address[uniqueID].zip.code = place.address_components[i].short_name; //13088
				break;
			case "postal_code_suffix":
				nebula.user.address[uniqueID].zip.suffix = place.address_components[i].short_name; //4725
				break;
			default:
				//console.log('Address component ' + place.address_components[i].types[0] + ' not used.');
		}
	}

	if ( nebula.user.address[uniqueID].street.number && nebula.user.address[uniqueID].street.name ){
		nebula.user.address[uniqueID].street.full = nebula.user.address[uniqueID].street.number + ' ' + nebula.user.address[uniqueID].street.name;
	}

	if ( nebula.user.address[uniqueID].zip.code && nebula.user.address[uniqueID].zip.suffix ){
		nebula.user.address[uniqueID].zip.full = nebula.user.address[uniqueID].zip.code + '-' + nebula.user.address[uniqueID].zip.suffix;
	}

	return nebula.user.address[uniqueID];
}

//Request Geolocation
function requestPosition(){
	if ( typeof google !== 'undefined' && has(google, 'maps') ){
		nebulaLoadJS('https://www.google.com/jsapi?key=' + nebula.site.options.nebula_google_browser_api_key, function(){ //May not need key here, but just to be safe.
			google.load('maps', '3', {
				other_params: 'libraries=placeskey=' + nebula.site.options.nebula_google_browser_api_key,
				callback: function(){
					getCurrentPosition();
				}
			});
		});
	} else {
		getCurrentPosition();
	}
}

function getCurrentPosition(){
	var nav = null;
	if (nav === null){
		nav = window.navigator;
	}
	var geolocation = nav.geolocation;
	if ( geolocation != null ){
		geolocation.getCurrentPosition(geoSuccessCallback, geoErrorCallback, {enableHighAccuracy: true}); //One-time location poll
		//geoloc.watchPosition(successCallback, errorCallback, {enableHighAccuracy: true}); //Continuous location poll (This will update the nebula.session.geolocation object regularly, but be careful sending events to GA- may result in TONS of events)
	}
}

//Geolocation Success
function geoSuccessCallback(position){
	nebula.session.geolocation = {
		error: false,
		coordinates: { //A value in decimal degrees to an precision of 4 decimal places is precise to 11.132 meters at the equator. A value in decimal degrees to 5 decimal places is precise to 1.1132 meter at the equator.
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		},
		accuracy: {
			meters: position.coords.accuracy,
			miles: (position.coords.accuracy*0.000621371).toFixed(2),
		},
		altitude: { //Above the mean sea level
			meters: position.coords.altitude,
			miles: (position.coords.altitude*0.000621371).toFixed(2),
			accuracy: position.coords.altitudeAccuracy,
		},
		speed: {
			mps: position.coords.speed,
			kph: (position.coords.speed*3.6).toFixed(2),
			mph: (position.coords.speed*2.23694).toFixed(2),
		},
		heading: position.coords.heading, //Degrees clockwise from North
		address: false
	}

	if ( nebula.session.geolocation.accuracy.meters < 50 ){
		nebula.session.geolocation.accuracy.color = '#00bb00';
		ga('set', nebula.analytics.dimensions.geoAccuracy, 'Excellent (<50m)');
	} else if ( nebula.session.geolocation.accuracy.meters > 50 && nebula.session.geolocation.accuracy.meters < 300 ){
		nebula.session.geolocation.accuracy.color = '#a4ed00';
		ga('set', nebula.analytics.dimensions.geoAccuracy, 'Good (50m - 300m)');
	} else if ( nebula.session.geolocation.accuracy.meters > 300 && nebula.session.geolocation.accuracy.meters < 1500 ){
		nebula.session.geolocation.accuracy.color = '#ffc600';
		ga('set', nebula.analytics.dimensions.geoAccuracy, 'Poor (300m - 1500m)');
	} else {
		nebula.session.geolocation.accuracy.color = '#ff1900';
		ga('set', nebula.analytics.dimensions.geoAccuracy, 'Very Poor (>1500m)');
	}

	addressLookup(position.coords.latitude, position.coords.longitude);

	sessionStorage['nebulaSession'] = JSON.stringify(nebula.session);
	nebula.dom.document.trigger('geolocationSuccess');
	nebula.dom.body.addClass('geo-latlng-' + nebula.session.geolocation.coordinates.latitude.toFixed(4).replace('.', '_') + '_' + nebula.session.geolocation.coordinates.longitude.toFixed(4).replace('.', '_') + ' geo-acc-' + nebula.session.geolocation.accuracy.meters.toFixed(0).replace('.', ''));
	ga('set', nebula.analytics.dimensions.geolocation, nebula.session.geolocation.coordinates.latitude.toFixed(4) + ', ' + nebula.session.geolocation.coordinates.longitude.toFixed(4));
	ga('send', 'event', 'Geolocation', nebula.session.geolocation.coordinates.latitude.toFixed(4) + ', ' + nebula.session.geolocation.coordinates.longitude.toFixed(4), 'Accuracy: ' + nebula.session.geolocation.accuracy.meters.toFixed(2) + ' meters');
	nv('identify', {'geolocation': nebula.session.geolocation.coordinates.latitude.toFixed(4) + ', ' + nebula.session.geolocation.coordinates.longitude.toFixed(4) + ' (Accuracy: ' + nebula.session.geolocation.accuracy.meters.toFixed(2) + ' meters'});
}

//Geolocation Error
function geoErrorCallback(error){
	switch (error.code){
		case error.PERMISSION_DENIED:
			geolocationErrorMessage = 'Access to your location is turned off. Change your settings to report location data.';
			var geoErrorNote = 'Denied';
			break;
		case error.POSITION_UNAVAILABLE:
			geolocationErrorMessage = "Data from location services is currently unavailable.";
			var geoErrorNote = 'Unavailable';
			break;
		case error.TIMEOUT:
			geolocationErrorMessage = "Location could not be determined within a specified timeout period.";
			var geoErrorNote = 'Timeout';
			break;
		default:
			geolocationErrorMessage = "An unknown error has occurred.";
			var geoErrorNote = 'Error';
			break;
	}

	nebula.session.geolocation = {
		error: {
			code: error.code,
			description: geolocationErrorMessage
		}
	}

	nebula.dom.document.trigger('geolocationError');
	nebula.dom.body.addClass('geo-error');
	ga('set', nebula.analytics.dimensions.geolocation, geolocationErrorMessage);
	ga('send', 'exception', {'exDescription': '(JS) Geolocation error: ' + geolocationErrorMessage, 'exFatal': false});
	nv('event', 'Geolocation Error');
}


//Rough address Lookup
//If needing to look up an address that isn't the user's geolocation based on lat/long, consider a different function. This one stores user data.
function addressLookup(lat, lng){
	geocoder = new google.maps.Geocoder();
	latlng = new google.maps.LatLng(lat, lng); //lat, lng
	geocoder.geocode({'latLng': latlng}, function(results, status){
		if ( status === google.maps.GeocoderStatus.OK ){
			if ( results ){
				nebula.session.geolocation.address = {
					number: extractFromAddress(results[0].address_components, "street_number"),
					street: extractFromAddress(results[0].address_components, "route"),
					city: extractFromAddress(results[0].address_components, "locality"),
					town: extractFromAddress(results[0].address_components, "administrative_area_level_3"),
					county: extractFromAddress(results[0].address_components, "administrative_area_level_2"),
					state: extractFromAddress(results[0].address_components, "administrative_area_level_1"),
					country: extractFromAddress(results[0].address_components, "country"),
					zip: extractFromAddress(results[0].address_components, "postal_code"),
					formatted: results[0].formatted_address,
					place: {
						id: results[0].place_id,
					},
				};
				nv('identify', {'address_lookup': results[0].formatted_address});

				sessionStorage['nebulaSession'] = JSON.stringify(nebula.session);
				nebula.dom.document.trigger('addressSuccess');
				if ( nebula.session.geolocation.accuracy.meters < 100 ){
					placeLookup(results[0].place_id);
				}
			}
		}
	});
}

//Extract address components from Google Maps Geocoder
function extractFromAddress(components, type){
	for ( var i = 0; i < components.length; i++ ){
		for ( var j = 0; j < components[i].types.length; j++ ){
			if ( components[i].types[j] === type ){
				return components[i].long_name;
			}
		}
	}

	return '';
}

//Lookup place information
function placeLookup(placeID){
	if ( has(google, 'maps.places') ){
		var service = new google.maps.places.PlacesService(jQuery('<div></div>').get(0));
		service.getDetails({
			placeId: placeID
		}, function(place, status){
			if ( status === google.maps.places.PlacesServiceStatus.OK ){
				if ( typeof place.name !== 'undefined' ){
					nebula.session.geolocation.address.place = {
						id: placeID,
						name: place.name,
						url: place.url,
						website: place.website,
						phone: place.formatted_phone_number,
						ratings: {
							rating: place.rating,
							total: place.user_ratings_total,
							reviews: ( typeof place.reviews !== 'undefined' )? place.reviews.length : 0,
						},
						utc_offset: place.utc_offset,
					}

					sessionStorage['nebulaSession'] = JSON.stringify(nebula.session);
					nebula.dom.document.trigger('placeSuccess');
				}
			}
		});
	}
}

/*==========================
 Helper Functions
 These functions enhance other aspects of the site like HTML/CSS.
 ===========================*/

//Miscellaneous helper classes and functions
function nebulaHelpers(){
	//Remove Sass render trigger query
	if ( get('sass') && !get('persistent') && window.history.replaceState ){ //IE10+
		window.history.replaceState({}, document.title, removeQueryParameter('sass', window.location.href));
	}

	nebula.dom.html.removeClass('no-js').addClass('js'); //In case Modernizr is not being used
	jQuery("a[href^='http']:not([href*='" + nebula.site.domain + "'])").attr('rel', 'nofollow external noopener'); //Add rel attributes to external links. Although search crawlers do use JavaScript, don't rely on this line to instruct them. Use standard HTML attributes whenever possible.

	if ( 'deviceMemory' in navigator ){ //Device Memory - Chrome 64+
		var deviceMemoryLevel = navigator.deviceMemory < 1 ? 'lite' : 'full';
		nebula.dom.html.addClass('device-memory-' + deviceMemoryLevel);
	}

	//Remove filetype icons from images within <a> tags and buttons.
	jQuery('a img').closest('a').addClass('no-icon');
	jQuery('.no-icon:not(a)').find('a').addClass('no-icon');

	jQuery('span.nebula-code').parent('p').css('margin-bottom', '0px'); //Fix for <p> tags wrapping Nebula pre spans in the WYSIWYG
}

function initBootstrapFunctions(){
	if ( typeof bootstrap !== 'undefined' ){
		//Tooltips
		if ( jQuery('[data-toggle="tooltip"]').length ){
			jQuery('[data-toggle="tooltip"]').tooltip();
		}

		//Popovers
		if ( jQuery('[data-toggle="popover"]').length ){
			jQuery('[data-toggle="popover"]').popover();
		}

		checkBootstrapToggleButtons();
		jQuery('[data-toggle=buttons] input').on('change', function(){
			checkBootstrapToggleButtons();
		});

		//Carousels - Override this to customize options
		if ( jQuery('.carousel').length ){
			jQuery('.carousel').each(function(){
				if ( jQuery(this).hasClass('auto-indicators') ){
					var carouselID = jQuery(this).attr('id');
					var slideCount = jQuery(this).find('.carousel-item').length;

					var i = 0;
					var markup = '<ol class="carousel-indicators">'; //@TODO "Nebula" 0: Why is there no space between indicators when using this auto-indicators?
					while ( i < slideCount ){
						var active = ( i === 0 )? 'class="active"' : '';
						markup += '<li data-target="#' + carouselID + '" data-slide-to="' + i + '" ' + active + '></li>';
						i++;
					}
					markup += '</ol>';
					jQuery(this).prepend(markup);
					jQuery(this).find('.carousel-item').first().addClass('active');

					if ( !jQuery(this).find('.carousel-inner').length ){
						jQuery(this).find('.carousel-item').wrapAll('<div class="carousel-inner">');
					}
				}

				jQuery(this).carousel();
			});
		}

		//Allow Bootstrap modals to use Nebula animation transitions
		jQuery(document).on('show.bs.modal', function(e){
			var anim = jQuery(e.target).attr('data-animation-in') || jQuery(e.target).attr('data-animation');
			jQuery('#' + e.target.id + ' .modal-dialog').attr('class', 'modal-dialog ' + anim + ' animate'); //Replace classes each time for re-animation.
		});
		jQuery(document).on('hide.bs.modal', function(e){
			var anim = jQuery(e.target).attr('data-animation-out') || '';
			jQuery('#' + e.target.id + ' .modal-dialog').attr('class', 'modal-dialog ' + anim + ' animate'); //Replace classes each time for re-animation.
		});
	}
}

//Add an "inactive" class to toggle buttons when one is checked to allow for additional styling options
function checkBootstrapToggleButtons(){
	jQuery('[data-toggle=buttons]').each(function(){
		if ( jQuery(this).find('input:checked').length ){
			jQuery(this).find('input').each(function(){
				if ( jQuery(this).is(':checked') ){
					jQuery(this).closest('.btn').removeClass('inactive');
				} else {
					jQuery(this).closest('.btn').addClass('inactive');
				}
			});
		}
	});
}

//Try to fix some errors automatically
function errorMitigation(){
	//Try to fall back to .png on .svg errors. Else log the broken image.
	jQuery('img').on('error', function(){
		thisImage = jQuery(this);
		imagePath = thisImage.attr('src');
		if ( imagePath.split('.').pop() === 'svg' ){
			fallbackPNG = imagePath.replace('.svg', '.png');
			jQuery.get(fallbackPNG).done(function(){
				thisImage.prop('src', fallbackPNG);
				thisImage.removeClass('svg');
			}).fail(function() {
				ga('send', 'exception', {'exDescription': '(JS) Broken Image: ' + imagePath, 'exFatal': false});
				nv('event', 'Broken Image');
			});
		} else {
			ga('send', 'exception', {'exDescription': '(JS) Broken Image: ' + imagePath, 'exFatal': false});
			nv('event', 'Broken Image');
		}
	});
}

//Convert img tags with class .svg to raw SVG elements
function svgImgs(){
	jQuery('img.svg').each(function(){
		var oThis = jQuery(this);

		if ( oThis.attr('src').indexOf('.svg') >= 1 ){
			jQuery.get(oThis.attr('src'), function(data){
				var theSVG = jQuery(data).find('svg'); //Get the SVG tag, ignore the rest
				theSVG = theSVG.attr('id', oThis.attr('id')); //Add replaced image's ID to the new SVG
				theSVG = theSVG.attr('class', oThis.attr('class') + ' replaced-svg'); //Add replaced image's classes to the new SVG
				theSVG = theSVG.attr('data-original-src', oThis.attr('src')); //Add an attribute of the original SVG location
				theSVG = theSVG.removeAttr('xmlns:a'); //Remove invalid XML tags
				oThis.replaceWith(theSVG); //Replace image with new SVG
			}, 'xml');
		}
	});
}

//Offset must be an integer
function nebulaScrollTo(element, milliseconds, offset, onlyWhenBelow, callback){
	if ( !offset ){
		var offset = 0; //Note: This selector should be the height of the fixed header, or a hard-coded offset.
	}

	//Call this function with a jQuery object to trigger scroll to an element (not just a selector string).
	if ( element ){
		if ( typeof element === 'string' ){
			element = jQuery(element);
		}

		if ( element.length ){
			var willScroll = true;
			if ( onlyWhenBelow ){
				var elementTop = element.offset().top-offset;
				var viewportTop = nebula.dom.document.scrollTop();
				if ( viewportTop-elementTop <= 0 ){
					willScroll = false;
				}
			}

			if ( willScroll ){
				if ( !milliseconds ){
					var milliseconds = 500;
				}

				jQuery('html, body').animate({
					scrollTop: element.offset().top-offset
				}, milliseconds, function(){
					if ( callback ){
						callback();
					}
				});
			}
		}

		return false;
	}

	nebula.dom.document.on('click', 'a[href^="#"]:not([href="#"])', function(){ //Using an ID as the href.
		var avoid = '.no-scroll, .mm-menu, .carousel, .tab-content, .modal, [data-toggle], #wpadminbar, #query-monitor';
		if ( jQuery(this).is(avoid) || jQuery(this).parents(avoid).length ){
			return false;
		}

		pOffset = ( jQuery(this).attr('offset') )? parseFloat(jQuery(this).attr('offset')) : 0;
		if ( location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname ){
			var target = jQuery(this.hash) || jQuery('[name=' + this.hash.slice(1) +']');
			if ( target.length ){ //If target exists
				var nOffset = Math.floor(target.offset().top-offset+pOffset);
				jQuery('html, body').animate({
					scrollTop: nOffset
				}, 500);
				return false;
			}
		}
	});

	nebula.dom.document.on('click', '.nebula-scrollto', function(){ //Using the nebula-scrollto class with scrollto attribute.
		pOffset = ( jQuery(this).attr('offset') )? parseFloat(jQuery(this).attr('offset')) : 0;
		if ( jQuery(this).attr('scrollto') ){
			var scrollElement = jQuery(this).attr('scroll-to');
			if ( scrollElement !== '' ){
				jQuery('html, body').animate({
					scrollTop: Math.floor(jQuery(scrollElement).offset().top-offset+pOffset)
				}, 500);
			}
		}
		return false;
	});
}


/*==========================
 Utility Functions
 These functions simplify and enhance other JavaScript functions
 ===========================*/

//Get query string parameters
function getQueryStrings(url, format){
	if ( !url ){
		url = document.URL;
	}

	if ( !format ){
		format = 'object';
	}

	var queryString = url.split('?')[1];

	if ( queryString ){
		if ( format === 'string' ){
			return '?' + queryString;
		}

		var queries = {};
		queryStrings = queryString.split('&');
		for ( var i = 0; i < queryStrings.length; i++ ){
			hash = queryStrings[i].split('=');
			if ( hash[1] ){
				queries[hash[0]] = hash[1];
			} else {
				queries[hash[0]] = true;
			}
		}

		return queries;
	}

	if ( format === 'string' ){
		return '';
	}

	return false;
}

//Search query strings for the passed parameter
function get(parameter, url){
	var queries = getQueryStrings(url);

	if ( !parameter ){
		return queries;
	}

	return queries[parameter] || false;
}

//Remove an array of parameters from the query string.
function removeQueryParameter(keys, sourceURL){
	if ( typeof keys === 'string' ){
		keys = [keys];
	}

	jQuery.each(keys, function(index, item){
		var url = sourceURL;
		if ( typeof newURL !== 'undefined' ){
			url = newURL;
		}

		var baseURL = url.split('?')[0];
		var param;
		var params_arr = [];
		var queryString = ( url.indexOf('?') !== -1 )? url.split('?')[1] : '';

		if ( queryString !== '' ){
			params_arr = queryString.split('&');

			for ( i = params_arr.length-1; i >= 0; i -= 1 ){
				param = params_arr[i].split('=')[0];
				if ( param === item ){
					params_arr.splice(i, 1);
				}
			}

			newURL = baseURL + '?' + params_arr.join('&');
		}
	});

	//Check if it is empty after parameter removal
	if ( typeof newURL !== 'undefined' && newURL.split('?')[1] === '' ){
		return newURL.split("?")[0]; //Return the URL without a query
	}

	return newURL;
}

//Trigger a reflow on an element.
//This is useful for repeating animations.
function reflow(selector){
	if ( typeof selector === 'string' ){
		var element = jQuery(selector);
	} else if ( typeof selector === 'object' ) {
		var element = selector;
	} else {
		return false;
	}

	element.width();
}

//Handle repeated animations in a single function.
function nebulaAnimate(selector, newAnimationClasses, oldAnimationClasses){
	if ( typeof selector === 'string' ){
		var element = jQuery(selector);
	} else if ( typeof selector === 'object' ) {
		var element = selector;
	} else {
		return false;
	}

	newAnimationClasses += ' animate';
	element.removeClass(newAnimationClasses); //Remove classes first so they can be re-added.

	if ( oldAnimationClasses ){
		element.removeClass(oldAnimationClasses); //Remove conflicting animation classes.
	}

	reflow(element); //Refresh the element so it can be animated again.
	element.addClass(newAnimationClasses); //Animate the element.
}

//Helpful animation event listeners
function animationTriggers(){
	//On document ready
	jQuery('.ready').each(function(){
		loadAnimate(jQuery(this));
	});

	//On window load
	nebula.dom.window.on('load', function(){
		jQuery('.load').each(function(){
			loadAnimate(jQuery(this));
		});
	});

	//On click
	nebula.dom.document.on('click', '.click, [nebula-click]', function(){
		var animationClass = jQuery(this).attr('nebula-click') || '';
		nebulaAnimate(jQuery(this), animationClass);
	});
}

function loadAnimate(oThis){
	animationDelay = oThis.attr('nebula-delay');
	if ( typeof animationDelay === 'undefined' || animationDelay === 0 ){
		nebulaAnimate(oThis, 'load-animate');
	} else {
		setTimeout(function(){
			nebulaAnimate(oThis, 'load-animate');
		}, animationDelay);
	}
}

//Allows something to be called once per pageload.
//Call without self-executing parenthesis in the parameter! Ex: once(customFunction, 'test example');
//To add parameters, use an array as the 2nd parameter. Ex: once(customFunction, ['parameter1', 'parameter2'], 'test example');
//Can be used for boolean. Ex: once('boolean test');
function once(fn, args, unique){
	if ( typeof onces === 'undefined' ){
		onces = {};
	}

	if ( typeof args === 'string' ){ //If no parameters
		unique = args;
		args = [];
	}

	//Reset all
	if ( fn === 'clear' || fn === 'reset' ){
		onces = {};
	}

	//Remove a single entry
	if ( fn === 'remove' ){
		delete onces[unique];
	}

	if ( typeof fn === 'function' ){ //If the first parameter is a function
		if ( typeof onces[unique] === 'undefined' || !onces[unique] ){
			onces[unique] = true;
			return fn.apply(this, args);
		}
	} else { //Else return boolean
		unique = fn; //If only one parameter is passed
		if ( typeof onces[unique] === 'undefined' || !onces[unique] ){
			onces[unique] = true;
			return true;
		} else {
			return false;
		}
	}
}

//Waits for events to finish before triggering
//Passing immediate triggers the function on the leading edge (instead of the trailing edge).
function debounce(callback, wait, uniqueID, immediate){
	if ( typeof debounceTimers === "undefined" ){
		debounceTimers = {};
	}

	if ( !uniqueID ){
		uniqueID = "Don't call this twice without a uniqueID";
	}

	var context = this, args = arguments;
	var later = function(){
		debounceTimers[uniqueID] = null;
		if ( !immediate ){
			callback.apply(context, args);
		}
	};
	var callNow = immediate && !debounceTimers[uniqueID];

	clearTimeout(debounceTimers[uniqueID]);
	debounceTimers[uniqueID] = setTimeout(later, wait);
	if ( callNow ){
		callback.apply(context, args);
	}
};

//Cookie Management
function createCookie(name, value, days){
	if ( !days ){
		var days = 3650; //10 years
	}

	if ( days ){
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires=" + date.toGMTString(); //Note: Do not let this cookie expire past 2038 or it instantly expires. http://en.wikipedia.org/wiki/Year_2038_problem
	} else {
		var expires = "";
	}
	document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name){
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for ( var i = 0; i < ca.length; i++ ){
		var c = ca[i];
		while ( c.charAt(0) === ' ' ){
			c = c.substring(1, c.length);
		}
		if ( c.indexOf(nameEQ) === 0 ){
			return c.substring(nameEQ.length, c.length);
		}
	}
	return null;
}
function eraseCookie(name){
	createCookie(name, "", -1);
}

//Time specific events. Unique ID is required. Returns time in milliseconds.
//Data can be accessed outside of this function via nebula.timings array.
function nebulaTimer(uniqueID, action, name){
	if ( !window.performance ){ //Safari 11+
		return false;
	}

	if ( typeof nebula.timings === 'undefined' ){
		nebula.timings = [];
	}

	//uniqueID is required
	if ( !uniqueID || uniqueID === 'start' || uniqueID === 'lap' || uniqueID === 'end' ){
		return false;
	}

	if ( !action ){
		if ( typeof nebula.timings[uniqueID] === 'undefined' ){
			action = 'start';
		} else {
			action = 'lap';
		}
	}

	//Can not lap or end a timing that has not started.
	if ( action !== 'start' && typeof nebula.timings[uniqueID] === 'undefined' ){
		return false;
	}

	//Can not modify a timer once it has ended.
	if ( typeof nebula.timings[uniqueID] !== 'undefined' && nebula.timings[uniqueID].total > 0 ){
		return nebula.timings[uniqueID].total;
	}

	//Update the timing data!
	currentTime = performance.now();

	if ( action === 'start' && typeof nebula.timings[uniqueID] === 'undefined' ){
		nebula.timings[uniqueID] = {};
		nebula.timings[uniqueID].started = currentTime;
		nebula.timings[uniqueID].cumulative = 0;
		nebula.timings[uniqueID].total = 0;
		nebula.timings[uniqueID].lap = [];
		nebula.timings[uniqueID].laps = 0;

		thisLap = {
			name: false,
			started: currentTime,
			stopped: 0,
			duration: 0,
			progress: 0,
		};
		nebula.timings[uniqueID].lap.push(thisLap);

		if ( typeof name !== 'undefined' ){
			nebula.timings[uniqueID].lap[0].name = name;
		}

		//Add the time to User Timing API (if supported)
		if ( typeof performance.measure !== 'undefined' ){
			performance.mark(uniqueID + '_start');
		}
	} else {
		lapNumber = nebula.timings[uniqueID].lap.length;

		//Finalize the times for the previous lap
		nebula.timings[uniqueID].lap[lapNumber-1].stopped = currentTime;
		nebula.timings[uniqueID].lap[lapNumber-1].duration = currentTime-nebula.timings[uniqueID].lap[lapNumber-1].started;
		nebula.timings[uniqueID].lap[lapNumber-1].progress = currentTime-nebula.timings[uniqueID].started;
		nebula.timings[uniqueID].cumulative = currentTime-nebula.timings[uniqueID].started;

		//An "out" lap means the timing for this lap may not be associated directly with the action (Usually resetting for the next actual timed lap).
		if ( action === 'start' ){
			nebula.timings[uniqueID].lap[lapNumber-1].out = true; //If another 'start' was sent, then the previous lap was an out lap
		} else {
			nebula.timings[uniqueID].lap[lapNumber-1].out = false;
		}

		//Prepare the current lap
		if ( action !== 'end' ){
			nebula.timings[uniqueID].laps++;
			if ( lapNumber > 0 ){
				nebula.timings[uniqueID].lap[lapNumber] = {};
				nebula.timings[uniqueID].lap[lapNumber].started = nebula.timings[uniqueID].lap[lapNumber-1].stopped;
			}

			if ( typeof name !== 'undefined' ){
				nebula.timings[uniqueID].lap[lapNumber].name = name;
			}

			//Add the time to User Timing API (if supported)
			if ( typeof performance.measure !== 'undefined' ){
				var lapID = name || lapNumber;
				performance.mark(uniqueID + '_lap-' + lapID);
			}
		}

		//Return individual lap times unless 'end' is passed- then return total duration. Note: 'end' can not be updated more than once per uniqueID! Subsequent calls will return the total duration from first call.
		if ( action === 'end' ){
			//Add the time to User Timing API (if supported)
			if ( typeof performance.measure !== 'undefined' ){
				performance.mark(uniqueID + '_end');

				if ( performance.getEntriesByName(uniqueID + '_start', 'mark') ){ //Make sure the start mark exists
					performance.measure(uniqueID, uniqueID + '_start', uniqueID + '_end');
				}
			}

			nebula.timings[uniqueID].stopped = currentTime;
			nebula.timings[uniqueID].total = currentTime-nebula.timings[uniqueID].started;
			//@todo "Nebula" 0: Add all hot laps together (any non-"out" laps)
			return nebula.timings[uniqueID].total;
		} else {
			if ( !nebula.timings[uniqueID].lap[lapNumber-1].out ){
				return nebula.timings[uniqueID].lap[lapNumber-1].duration;
			}
		}
	}
}

//Convert milliseconds into separate hours, minutes, and seconds string (Ex: "3h 14m 35.2s").
function millisecondsToString(ms){
	var milliseconds = parseInt((ms%1000)/100);
	var seconds = parseInt((ms/1000)%60);
	var minutes = parseInt((ms/(1000*60))%60);
	var hours = parseInt((ms/(1000*60*60))%24);

	var timeString = '';
	if ( hours > 0 ){
		timeString += hours + 'h ';
	}
	if ( minutes > 0 ){
		timeString += minutes + 'm ';
	}
	if ( seconds > 0 || milliseconds > 0 ){
		timeString += seconds;

		if ( milliseconds > 0 ){
			timeString += '.' + milliseconds;
		}

		timeString += 's';
	}
	return timeString;
}

//Convert time to relative.
//For cross-browser support, timestamp must be passed as a string (not a Date object) in the format: Fri Mar 27 21:40:02 +0000 2016
function timeAgo(timestamp, raw){ //http://af-design.com/blog/2009/02/10/twitter-like-timestamps/
	if ( typeof timestamp === 'object' ){
		console.warn('Pass date as string in the format: Fri Mar 27 21:40:02 +0000 2016');
	}

	var postDate = new Date(timestamp);
	var currentTime = new Date();

	//Browser sanitation
	if ( jQuery('.ie, .internet_explorer, .microsoft_edge').length ){
		postDate = Date.parse(timestamp.replace(/( \+)/, ' UTC$1'));
	}

	var diff = Math.floor((currentTime-postDate)/1000);

	if ( raw ){
		return diff;
	}

	if ( diff <= 1 ){ return "just now"; }
	if ( diff < 20 ){ return diff + " seconds ago"; }
	if ( diff < 60 ){ return "less than a minute ago"; }
	if ( diff <= 90 ){ return "one minute ago"; }
	if ( diff <= 3540 ){ return Math.round(diff/60) + " minutes ago"; }
	if ( diff <= 5400 ){ return "1 hour ago"; }
	if ( diff <= 86400 ){ return Math.round(diff/3600) + " hours ago"; }
	if ( diff <= 129600 ){ return "1 day ago"; }
	if ( diff < 604800 ){ return Math.round(diff/86400) + " days ago"; }
	if ( diff <= 777600 ){ return "1 week ago"; }

	return "on " + timestamp;
}

//Check nested objects (boolean). Note: This function can not check if the object itself exists.
//has(nebula, 'user.client.remote_addr'); //Ex: object nebula must exist first (check for it separately)
function has(obj, prop){
	var parts = prop.split('.');
	for ( var i = 0, l = parts.length; i < l; i++ ){
		var part = parts[i];
		if ( obj !== null && typeof obj === "object" && part in obj ){
			obj = obj[part];
		} else {
			return false;
		}
	}

	return true;
}

/*==========================
 Miscellaneous Functions
 ===========================*/

//Functionality for selecting and copying text using Nebula Pre tags.
function nebulaPre(){
	try {
		if ( document.queryCommandEnabled("SelectAll") ){ //@TODO "Nebula" 0: If using document.queryCommandSupported("copy") it always returns false (even though it does actually work when execCommand('copy') is called.
			var selectCopyText = 'Copy to clipboard';
		} else if ( document.body.createTextRange || window.getSelection ){
			var selectCopyText = 'Select All';
		} else {
			return false;
		}
	} catch(err){
		if ( document.body.createTextRange || window.getSelection ){
			var selectCopyText = 'Select All';
		} else {
			return false;
		}
	}

	//Format non-shortcode pre tags to be styled properly
	jQuery('pre.nebula-code').each(function(){
		if ( !jQuery(this).parent('.nebula-code-con').length ){
			lang = jQuery.trim(jQuery(this).attr('class').replace('nebula-code', ''));
			jQuery(this).addClass(lang.toLowerCase()).wrap('<div class="nebula-code-con clearfix ' + lang.toLowerCase() + '"></div>');
			jQuery(this).closest('.nebula-code-con').prepend('<span class="nebula-code codetitle ' + lang.toLowerCase() + '">' + lang + '</span>');
		}
	});

	jQuery('.nebula-code-con').each(function(){
		jQuery(this).append('<a href="#" class="nebula-selectcopy-code">' + selectCopyText + '</a>');
		jQuery(this).find('p:empty').remove();
	});

	nebula.dom.document.on('click', '.nebula-selectcopy-code', function(){
		oThis = jQuery(this);

		if ( jQuery(this).text() === 'Copy to clipboard' ){
			 selectText(jQuery(this).closest('.nebula-code-con').find('pre'), 'copy', function(success){
				  if ( success ){
					oThis.text('Copied!').removeClass('error').addClass('success');
					setTimeout(function(){
						oThis.text('Copy to clipboard').removeClass('success');
					}, 1500);
				  } else {
					jQuery('.nebula-selectcopy-code').each(function(){
						jQuery(this).text('Select All');
					});
					oThis.text('Unable to copy.').addClass('error');
					setTimeout(function(){
						oThis.text('Select All').removeClass('error');
					}, 3500);
				  }
			 });
		} else {
			 selectText(jQuery(this).closest('.nebula-code-con').find('pre'), function(success){
				  if ( success ){
					oThis.text('Selected!').removeClass('error').addClass('success');
					setTimeout(function(){
						oThis.text('Select All').removeClass('success');
					}, 1500);
				  } else {
					jQuery('.nebula-selectcopy-code').each(function(){
						jQuery(this).hide();
					});
					oThis.text('Unable to select.').addClass('error');
				  }
			 });
		}
		return false;
	});
}

//Select (and optionally copy) text
function selectText(element, copy, callback){
	if ( typeof element === 'string' ){
		element = jQuery(element)[0];
	} else if ( typeof element === 'object' && element.nodeType !== 1 ){
		element = element[0];
	}

	if ( typeof copy === 'function' ){
		callback = copy;
		copy = null;
	}

	try {
		if ( document.body.createTextRange ){
			var range = document.body.createTextRange();
			range.moveToElementText(element);
			range.select();
			if ( !copy && callback ){
				callback(true);
				return false;
			}
		} else if ( window.getSelection ){
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents(element);
			selection.removeAllRanges();
			selection.addRange(range);
			if ( !copy && callback ){
				callback(true);
				return false;
			}
		}
	} catch(err){
		if ( callback ){
			callback(false);
			return false;
		}
	}

	if ( copy ){
		try {
			var success = document.execCommand('copy');
			if ( callback ){
				callback(success);
				return false;
			}
		} catch(err){
			if ( callback ){
				callback(false);
				return false;
			}
		}
	}

	if ( callback ){
		callback(false);
	}
	return false;
}

function copyText(string, callback){
	jQuery('<div>').attr('id', 'copydiv').text(string).css({'position': 'absolute', 'top': '0', 'left': '-9999px', 'width': '0', 'height': '0', 'opacity': '0', 'color': 'transparent'}).appendTo(nebula.dom.body);
	selectText(jQuery('#copydiv'), true, callback);
	jQuery('#copydiv').remove();
	return false;
}

//Sanitize text
function nebulaSanitize(text){
	return document.createElement('div').appendChild(document.createTextNode(text)).parentNode.innerHTML;
}

function chosenSelectOptions(){
	jQuery('.chosen-select').chosen({
		disable_search_threshold: 5,
		search_contains: true,
		no_results_text: "No results found.",
		allow_single_deselect: true,
		width: "100%"
	});
}

function dataTablesActions(){
	//DataTables search term highlighter. @TODO "Nebula" 0: Not quite ready... When highlighting, all other styling is removed.
/*
	nebula.dom.document.on('keyup', '.dataTables_wrapper .dataTables_filter input', function(){
		theSearchTerm = jQuery(this).val().replace(/(\s+)/,"(<[^>]+>)*$1(<[^>]+>)*");
		var pattern = new RegExp("(" + theSearchTerm + ")", "gi");
		if ( theSearchTerm.length ){
			jQuery('.dataTables_wrapper td').each(function(i){
				var searchFinder = jQuery(this).text().replace(new RegExp('(' + preg_quote(theSearchTerm) + ')', 'gi'), '<mark class="filterresultword">$1</mark>');
				jQuery(this).html(searchFinder);
			});
		} else {
			jQuery('.dataTables_wrapper td mark').each(function(){
				jQuery(this).contents().unwrap();
			});
		}
	});
*/
}

//Initialize Video Functionality and Tracking
function initVideoTracking(){
	if ( typeof nebula.videos === 'undefined' ){
		nebula.videos = {}
	}

	nebulaHTML5VideoTracking();
	nebulaYoutubeTracking();
	nebulaVimeoTracking();
}

//Track lazy-loaded videos
//Note: element can be anything! Don't assume it is a video.
function nebulaLazyVideoTracking(element){
	//Re-kick the API for lazy-loaded Youtube and Vimeo videos, and enable tracking for lazy-loaded HTML5 videos.
	if ( element.is('iframe[src*="youtube"]') ){
		addYoutubePlayer(element.attr('id'), element);
	} else if ( element.is('iframe[src*="vimeo"]') ){
		addVimeoPlayer(element.attr('id'), element);
	} else if ( element.is('video') ){
		addHTML5VideoPlayer(element.attr('id'), element);
	}
}

//Native HTML5 Videos
function nebulaHTML5VideoTracking(){
	jQuery('video').each(function(){
		var id = jQuery(this).attr('id');

		if ( typeof nebula.videos[id] === 'object' ){ //If this video is already being tracked ignore it
			return false;
		}

		addHTML5VideoPlayer(id, jQuery(this));
	});
}

function addHTML5VideoPlayer(id, element){
	var videoTitle = element.attr('title') || id || false;
	if ( !videoTitle ){ //An ID or title is required to track HTML5 videos
		return false;
	}

	nebula.videos[id] = {};
	nebula.videos[id].platform = 'html5'; //The platform the video is hosted using.
	nebula.videos[id].player = id; //The player ID of this video. Can access the API here.
	nebula.videos[id].title = videoTitle;
	nebula.videos[id].id = id;
	nebula.videos[id].element = element;
	nebula.videos[id].autoplay = ( element.attr('autoplay') )? true : false;
	nebula.videos[id].percent = 0; //The decimal percent of the current position. Multiply by 100 for actual percent.
	nebula.videos[id].seeker = false; //Whether the viewer has seeked through the video at least once.
	nebula.videos[id].seen = []; //An array of percentages seen by the viewer. This is to roughly estimate how much was watched.
	nebula.videos[id].watched = 0; //Amount of time watching the video (regardless of seeking). Accurate to 1% of video duration. Units: Seconds
	nebula.videos[id].watchedPercent = 0; //The decimal percent of the video watched. Multiply by 100 for actual percent.
	nebula.videos[id].pausedYet = false; //If this video has been paused yet by the user.
	nebula.videos[id].current = 0; //The current position of the video. Units: Seconds

	element.on('loadedmetadata', function(){
		nebula.videos[id].current = this.currentTime;
		nebula.videos[id].duration = this.duration; //The total duration of the video. Units: Seconds
	});

	element.on('play', function(){
		var thisVideo = nebula.videos[id];

		if ( 'mediaSession' in navigator && element.attr('title') ){ //Android Chrome 55+ only
			navigator.mediaSession.metadata = new MediaMetadata({
				title: element.attr('title'),
				artist: element.attr('artist') || '',
				album: element.attr('album') || '',
/*
				artwork: [{
					src: 'https://dummyimage.com/512x512',
					sizes: '512x512',
					type: 'image/png'
				}]
*/
			});
		}

		element.addClass('playing');

		//Only report to GA for non-autoplay videos
		if ( !element.is('[autoplay]') ){
			playAction = 'Play';
			if ( !isInView(element) ){
				playAction += ' (Not In View)';
			}

			ga('set', nebula.analytics.metrics.videoStarts, 1);
			ga('set', nebula.analytics.dimensions.videoWatcher, 'Started');
			ga('send', 'event', 'Videos', playAction, videoTitle, {'nonInteraction': thisVideo.autoplay});
			if ( !thisVideo.autoplay ){
				nv('event', 'Video Play Began: ' + thisVideo.title);
			}
		}

		nebula.dom.document.trigger('nebula_playing_video', thisVideo);
	});

	element.on('timeupdate', function(){
		var thisVideo = nebula.videos[id];

		thisVideo.current = this.currentTime; //@todo "Nebula" 0: Still getting NaN on HTML5 autoplay videos sometimes. I think the video begins playing before the metadata is ready...
		thisVideo.percent = thisVideo.current*100/thisVideo.duration; //Determine watched percent by adding current percents to an array, then count the array!
		nowSeen = Math.ceil(thisVideo.percent);
		if ( thisVideo.seen.indexOf(nowSeen) < 0 ){
			thisVideo.seen.push(nowSeen);
		}

		thisVideo.watchedPercent = thisVideo.seen.length;
		thisVideo.watched = (thisVideo.seen.length/100)*thisVideo.duration; //Roughly calculate time watched based on percent seen

		if ( thisVideo.watchedPercent > 25 && !thisVideo.engaged ){
			if ( isInView(element) ){
				ga('set', nebula.analytics.dimensions.videoWatcher, 'Engaged');

				engagedAction = 'Engaged';
				if ( thisVideo.autoplay ){
					engagedAction += ' (Autoplay)';
				}

				ga('send', 'event', 'Videos', engagedAction, thisVideo.title, {'nonInteraction': true});
				nv('event', 'Video Engagement: ' + thisVideo.title);
				thisVideo.engaged = true;
				nebula.dom.document.trigger('nebula_engaged_video', thisVideo);
			}
		}
	});

	element.on('pause', function(){
		var thisVideo = nebula.videos[id];
		element.removeClass('playing');

		ga('set', nebula.analytics.dimensions.videoWatcher, 'Paused');
		ga('set', nebula.analytics.metrics.videoPlaytime, Math.round(thisVideo.watched));
		ga('set', nebula.analytics.dimensions.videoPercentage, Math.round(thisVideo.percent*100));

		if ( !thisVideo.pausedYet ){
			ga('send', 'event', 'Videos', 'First Pause', thisVideo.title);
			thisVideo.pausedYet = true;
		}

		ga('send', 'event', 'Videos', 'Paused', thisVideo.title);
		ga('send', 'timing', 'Videos', 'Paused', Math.round(thisVideo.current*1000), thisVideo.title);
		nv('event', 'Video Paused: ' + thisVideo.title);
		nebula.dom.document.trigger('nebula_paused_video', thisVideo);
	});

	element.on('seeked', function(){
		var thisVideo = nebula.videos[id];

		if ( thisVideo.current == 0 && element.is('[loop]') ){ //If the video is set to loop and is starting again
			//If it is an autoplay video without controls, don't log loops
			if ( element.is('[autoplay]') && !element.is('[controls]') ){
				return false;
			}

			endedAction = 'Ended (Looped)';
			if ( !isInView(element) ){
				endedAction += ' (Not In View)';
			}

			if ( thisVideo.autoplay ){
				endedAction += ' (Autoplay)';
			}

			ga('send', 'event', 'Videos', endedAction, thisVideo.title, {'nonInteraction': true});
		} else { //Otherwise, the user seeked
			debounce(function(){
				ga('set', nebula.analytics.dimensions.videoWatcher, 'Seeker');
				ga('send', 'event', 'Videos', 'Seek', thisVideo.title + ' [to: ' + thisVideo.current.toFixed(0) + ']');
				nv('event', 'Video Seek: ' + thisVideo.title);
				thisVideo.seeker = true;
				nebula.dom.document.trigger('nebula_seeked_video', thisVideo);
			}, 250, 'video seeking')
		}
	});

	element.on('volumechange', function(){
		var thisVideo = nebula.videos[id];
		//console.debug(this);
	});

	element.on('ended', function(){
		var thisVideo = nebula.videos[id];
		element.removeClass('playing');

		ga('set', nebula.analytics.metrics.videoCompletions, 1);
		ga('set', nebula.analytics.metrics.videoPlaytime, Math.round(thisVideo.watched));
		ga('set', nebula.analytics.dimensions.videoWatcher, 'Ended');

		endedAction = 'Ended';
		if ( !isInView(element) ){
			endedAction += ' (Not In View)';
		}

		if ( thisVideo.autoplay ){
			endedAction += ' (Autoplay)';
		}

		ga('send', 'event', 'Videos', endedAction, thisVideo.title, {'nonInteraction': true});
		ga('send', 'timing', 'Videos', 'Ended', Math.round(thisVideo.current*1000), thisVideo.title);
		nv('event', 'Video Ended: ' + thisVideo.title);
		nebula.dom.document.trigger('nebula_ended_video', thisVideo);
	});
}


//Prepare Youtube Iframe API
function nebulaYoutubeTracking(){
	once(function(){
		if ( jQuery('iframe[src*="youtube"], .lazy-youtube').length ){
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		}
	}, 'nebula youtube api');
}

function onYouTubeIframeAPIReady(e){
	window.performance.mark('nebula_loading_youtube_videos_start');
	jQuery('iframe[src*="youtube"]').each(function(i, element){
		id = jQuery(this).attr('id');
		if ( !id ){
			id = jQuery(this).attr('src').split('?')[0].split('/').pop();
			jQuery(this).attr('id', id);
		}

		if ( jQuery(this).attr('src').indexOf('enablejsapi=1') > 0 ){ //If the iframe src already has the API enabled
			addYoutubePlayer(id);
			nebula.dom.document.trigger('nebula_youtube_players_created', nebula.videos[id]);
		} else {
			console.warn('The enablejsapi parameter was not found for this Youtube iframe. It has been reloaded to enable it. For better optimization, and more accurate analytics, add it to the iframe.');

			//JS API not enabled for this video. Reload the iframe with the correct parameter.
			var delimiter = ( jQuery(this).attr('src').indexOf('?') > 0 )? '&' : '?';
			jQuery(this).attr('src', jQuery(this).attr('src') + delimiter + 'enablejsapi=1').on('load', function(){
				addYoutubePlayer(id, jQuery(this));
				nebula.dom.document.trigger('nebula_youtube_players_created', nebula.videos[id]);
			});
		}
	});
	window.performance.mark('nebula_loading_youtube_videos_end');
	window.performance.measure('nebula_loading_youtube_videos', 'nebula_loading_youtube_videos_start', 'nebula_loading_youtube_videos_end');

	pauseFlag = false;
}

function addYoutubePlayer(id, element){
	if ( !id ){
		return false; //A Youtube ID is required to add player
	}

	nebula.videos[id] = {
		'player': new YT.Player(id, { //YT.Player parameter must match the iframe ID!
			events: { //If these events are only showing up as "true", try removing the &origin= parameter from the Youtube iframe src.
				'onReady': nebulaYoutubeReady,
				'onStateChange': nebulaYoutubeStateChange,
				'onError': nebulaYoutubeError
			}
		}),
	}

	if ( element ){
		nebula.videos[id].element = element;
	}
}

function nebulaYoutubeReady(e){
	if ( typeof videoProgress === 'undefined' ){
		videoProgress = {};
	}

	var id = nebulaGetYoutubeID(e.target);
	if ( id && !nebula.videos[id] ){ //If the video object doesn't use the Youtube video ID, make a new one by duplicating from the Iframe ID
		nebula.videos[id] = nebula.videos[jQuery(e.target.getIframe()).attr('id')];
	}

	nebula.videos[id].platform = 'youtube'; //The platform the video is hosted using.
	nebula.videos[id].element = e.target.getIframe(); //The player iframe. Selectable with jQuery(thisVideo.element)...
	nebula.videos[id].autoplay = jQuery(e.target.getIframe()).attr('src').indexOf('autoplay=1') > 0; //Look for the autoplay parameter in the ifrom src.
	nebula.videos[id].title = nebulaGetYoutubeTitle(e.target);
	nebula.videos[id].id = id;
	nebula.videos[id].duration = e.target.getDuration(); //The total duration of the video. Unit: Seconds
	nebula.videos[id].current = e.target.getCurrentTime(); //The current position of the video. Units: Seconds
	nebula.videos[id].percent = e.target.getCurrentTime()/e.target.getDuration(); //The percent of the current position. Multiply by 100 for actual percent.
	nebula.videos[id].engaged = false; //Whether the viewer has watched enough of the video to be considered engaged.
	nebula.videos[id].watched = 0; //Amount of time watching the video (regardless of seeking). Accurate to half a second. Units: Seconds
	nebula.videos[id].watchedPercent = 0; //The decimal percentage of the video watched. Multiply by 100 for actual percent.
	nebula.videos[id].pausedYet = false; //If this video has been paused yet by the user.
}

function nebulaYoutubeStateChange(e){
	var thisVideo = nebula.videos[nebulaGetYoutubeID(e.target)];
	thisVideo.title = nebulaGetYoutubeTitle(e.target);
	thisVideo.current = e.target.getCurrentTime();
	thisVideo.percent = thisVideo.current/thisVideo.duration;

	if ( e.data === YT.PlayerState.PLAYING ){
		ga('set', nebula.analytics.metrics.videoStarts, 1);
		ga('set', nebula.analytics.dimensions.videoWatcher, 'Started');

		playAction = 'Play';
		if ( !isInView(jQuery(thisVideo.element)) ){
			playAction += ' (Not In View)';
		}

		if ( thisVideo.autoplay ){
			playAction += ' (Autoplay)';
		} else {
			jQuery(thisVideo.element).addClass('playing');
		}

		ga('send', 'event', 'Videos', playAction, thisVideo.title);
		nv('event', 'Video Play Began: ' + thisVideo.title);
		nebula.dom.document.trigger('nebula_playing_video', thisVideo);
		pauseFlag = true;
		updateInterval = 500;

		youtubePlayProgress = setInterval(function(){
			thisVideo.current = e.target.getCurrentTime();
			thisVideo.percent = thisVideo.current/thisVideo.duration;
			thisVideo.watched = thisVideo.watched+(updateInterval/1000);
			thisVideo.watchedPercent = (thisVideo.watched)/thisVideo.duration;

			if ( thisVideo.watchedPercent > 0.25 && !thisVideo.engaged ){
				if ( isInView(jQuery(thisVideo.element)) ){
					ga('set', nebula.analytics.dimensions.videoWatcher, 'Engaged');

					engagedAction = 'Engaged';
					if ( thisVideo.autoplay ){
						engagedAction += ' (Autoplay)';
					}
					ga('send', 'event', 'Videos', engagedAction, thisVideo.title, {'nonInteraction': true});

					nv('event', 'Video Engaged: ' + thisVideo.title);
					thisVideo.engaged = true;
					nebula.dom.document.trigger('nebula_engaged_video', thisVideo);
				}
			}
		}, updateInterval);
	}

	if ( e.data === YT.PlayerState.ENDED ){
		jQuery(thisVideo.element).removeClass('playing');

		clearInterval(youtubePlayProgress);
		ga('set', nebula.analytics.metrics.videoCompletions, 1);
		ga('set', nebula.analytics.metrics.videoPlaytime, Math.round(thisVideo.watched/1000));
		ga('set', nebula.analytics.dimensions.videoWatcher, 'Ended');

		endedAction = 'Ended';
		if ( !isInView(jQuery(thisVideo.element)) ){
			endedAction += ' (Not In View)';
		}

		if ( thisVideo.autoplay ){
			endedAction += ' (Autoplay)';
		}

		ga('send', 'event', 'Videos', endedAction, thisVideo.title, {'nonInteraction': true});
		ga('send', 'timing', 'Videos', 'Ended', thisVideo.current*1000, thisVideo.title);
		nv('event', 'Video Ended: ' + thisVideo.title);
		nebula.dom.document.trigger('nebula_ended_video', thisVideo);
	} else if ( e.data === YT.PlayerState.PAUSED && pauseFlag ){
		jQuery(thisVideo.element).removeClass('playing');

		clearInterval(youtubePlayProgress);
		ga('set', nebula.analytics.metrics.videoPlaytime, Math.round(thisVideo.watched));
		ga('set', nebula.analytics.dimensions.videoPercentage, Math.round(thisVideo.percent*100));
		ga('set', nebula.analytics.dimensions.videoWatcher, 'Paused');

		if ( !thisVideo.pausedYet ){
			ga('send', 'event', 'Videos', 'First Pause', thisVideo.title);
			thisVideo.pausedYet = true;
		}

		ga('send', 'event', 'Videos', 'Paused', thisVideo.title);
		ga('send', 'timing', 'Videos', 'Paused', thisVideo.current*1000, thisVideo.title);
		nv('event', 'Video Paused: ' + thisVideo.title);
		nebula.dom.document.trigger('nebula_paused_video', thisVideo);
		pauseFlag = false;
	}
}

function nebulaYoutubeError(e){
	var thisVideo = nebula.videos[nebulaGetYoutubeID(e.target)];
	thisVideo.title = nebulaGetYoutubeTitle(e.target);

	ga('send', 'exception', {'exDescription': '(JS) Youtube API error for ' + thisVideo.title + ': ' + e.data, 'exFatal': false});
	nv('event', 'Youtube API Error');
}

//Get the ID of the Youtube video (or use best fallback possible)
function nebulaGetYoutubeID(target){
	var id;

	//If getVideoData is available in the API
	if ( target.getVideoData ){
		id = target.getVideoData().id || target.getVideoData().video_id;
	}

	//Make sure the ID was available within the getVideoData() otherwise use alternate methods
	if ( !id ){
		if ( target.getDebugText ){
			id = JSON.parse(target.getDebugText()).debug_videoId;
		} else {
			id = get('v', target.getVideoUrl()) || jQuery(target.getIframe()).attr('src').split('?')[0].split('/').pop() || jQuery(target.getIframe()).attr('id'); //Parse the video URL for the ID or use the iframe ID
		}
	}

	return id;
}

//Get the title of a Youtube video (or use best fallback possible)
function nebulaGetYoutubeTitle(target){
	var videoTitle;

	//If getVideoData is available in the API
	if ( target.getVideoData ){
		videoTitle = target.getVideoData().title;
	}

	return videoTitle || jQuery(target.getIframe()).attr('title') || nebulaGetYoutubeID(target) || false;
}

//Prepare Vimeo API
function nebulaVimeoTracking(){
	//Load the Vimeo API script (player.js) remotely (with local backup)
	if ( jQuery('iframe[src*="vimeo"], .lazy-vimeo').length ){
		nebulaLoadJS(nebula.site.resources.scripts.nebula_vimeo, function(){
			createVimeoPlayers();
		});
	}
}

//To trigger events on these videos, use the syntax: nebula.videos['PHG-Overview-Video'].play();
function createVimeoPlayers(){
	jQuery('iframe[src*="vimeo"]').each(function(i){
		var id = jQuery(this).attr('id');
		if ( !id ){
			id = jQuery(this).attr('src').split('player_id=').pop().split('&')[0];
			jQuery(this).attr('id', id);
		}

		if ( typeof nebula.videos[id] === 'object' ){ //If this video is already being tracked ignore it
			return false;
		}

		addVimeoPlayer(id, jQuery(this));
		nebula.dom.document.trigger('nebula_vimeo_players_created', nebula.videos[id]);
	});

	if ( typeof videoProgress === 'undefined' ){
		videoProgress = {};
	}
}

function vimeoReady(data){
	if ( typeof nebula.videos[data.id] === 'object' ){ //If this video is already being tracked ignore it
		return false;
	}

	nebula.videos[data.id].platform = 'vimeo'; //The platform the video is hosted using.
	nebula.videos[data.id].autoplay = jQuery(nebula.videos[data.id].element).attr('src').indexOf('autoplay=1') > 0, //Look for the autoplay parameter in the iframe src.
	nebula.videos[data.id].id = data.id;
	nebula.videos[data.id].current = 0; //The current position of the video. Units: Seconds
	nebula.videos[data.id].percent = 0; //The percent of the current position. Multiply by 100 for actual percent.
	nebula.videos[data.id].engaged = false; //Whether the viewer has watched enough of the video to be considered engaged.
	nebula.videos[data.id].seeker = false; //Whether the viewer has seeked through the video at least once.
	nebula.videos[data.id].seen = []; //An array of percentages seen by the viewer. This is to roughly estimate how much was watched.
	nebula.videos[data.id].watched = 0; //Amount of time watching the video (regardless of seeking). Accurate to 1% of video duration. Units: Seconds
	nebula.videos[data.id].watchedPercent = 0; //The decimal percentage of the video watched. Multiply by 100 for actual percent.
	nebula.videos[data.id].pausedYet = false; //If this video has been paused yet by the user.

	//Duration
	nebula.videos[data.id].getDuration().then(function(duration){
		nebula.videos[data.id].duration = duration; //The total duration of the video. Units: Seconds
	});

	//Title
	nebula.videos[data.id].getVideoTitle().then(function(title){
		nebula.videos[data.id].title = title; //The title of the video
	});
}

function vimeoPlay(data){
	var id = data.id || jQuery(this.element).attr('id');
	var thisVideo = nebula.videos[id];

	ga('set', nebula.analytics.metrics.videoStarts, 1);
	ga('set', nebula.analytics.dimensions.videoWatcher, 'Started');

	playAction = 'Play';
	if ( !isInView(jQuery(this.element)) ){
		playAction += ' (Not In View)';
	}

	if ( thisVideo.autoplay ){
		playAction += ' (Autoplay)';
	} else {
		jQuery(this).addClass('playing');
	}

	ga('send', 'event', 'Videos', playAction, thisVideo.title);
	nv('event', 'Video Play Began: ' + thisVideo.title);
	nebula.dom.document.trigger('nebula_playing_video', thisVideo.title);
}

function vimeoTimeUpdate(data){
	var id = data.id || jQuery(this.element).attr('id');
	var thisVideo = nebula.videos[id];

	thisVideo.duration = data.duration;
	thisVideo.current = data.seconds;
	thisVideo.percent = data.percent;

	//Determine watched percent by adding current percents to an array, then count the array!
	nowSeen = Math.ceil(data.percent*100);
	if ( thisVideo.seen.indexOf(nowSeen) < 0 ){
		thisVideo.seen.push(nowSeen);
	}
	thisVideo.watchedPercent = thisVideo.seen.length;
	thisVideo.watched = (thisVideo.seen.length/100)*thisVideo.duration; //Roughly calculate time watched based on percent seen

	if ( thisVideo.watchedPercent > 25 && !thisVideo.engaged ){
		if ( isInView(jQuery(this.element)) ){
			ga('set', nebula.analytics.dimensions.videoWatcher, 'Engaged');

			engagedAction = 'Engaged';
			if ( thisVideo.autoplay ){
				engagedAction += ' (Autoplay)';
			}
			ga('send', 'event', 'Videos', engagedAction, thisVideo.title, {'nonInteraction': true});

			nv('event', 'Video Engaged: ' + thisVideo.title);
			thisVideo.engaged = true;
			nebula.dom.document.trigger('nebula_engaged_video', thisVideo.title);
		}
	}
}

function vimeoPause(data){
	jQuery(this).removeClass('playing');

	var id = data.id || jQuery(this.element).attr('id');
	var thisVideo = nebula.videos[id];
	ga('set', nebula.analytics.dimensions.videoWatcher, 'Paused');
	ga('set', nebula.analytics.metrics.videoPlaytime, Math.round(thisVideo.watched));
	ga('set', nebula.analytics.dimensions.videoPercentage, Math.round(data.percent*100));

	if ( !thisVideo.pausedYet && !thisVideo.seeker ){ //Only capture first pause if they didn't seek
		ga('send', 'event', 'Videos', 'First Pause', thisVideo.title);
		thisVideo.pausedYet = true;
	}

	ga('send', 'event', 'Videos', 'Paused', thisVideo.title);
	ga('send', 'timing', 'Videos', 'Paused', Math.round(data.seconds*1000), videoTitle);
	nv('event', 'Video Paused: ' + thisVideo.title);
	nebula.dom.document.trigger('nebula_paused_video', thisVideo);
}

function vimeoSeeked(data){
	var id = data.id || jQuery(this.element).attr('id');
	var thisVideo = nebula.videos[id];

	ga('set', nebula.analytics.dimensions.videoWatcher, 'Seeker');
	ga('send', 'event', 'Videos', 'Seek', thisVideo.title + ' [to: ' + data.seconds + ']');
	nv('event', 'Video Seeked: ' + thisVideo.title);
	thisVideo.seeker = true;
	nebula.dom.document.trigger('nebula_seeked_video', id);
}

function vimeoEnded(data){
	jQuery(this).removeClass('playing');

	var id = jQuery(this.element).attr('id');
	var thisVideo = nebula.videos[id];
	ga('set', nebula.analytics.metrics.videoCompletions, 1);
	ga('set', nebula.analytics.metrics.videoPlaytime, Math.round(thisVideo.watched));
	ga('set', nebula.analytics.dimensions.videoWatcher, 'Ended');

	endedAction = 'Ended';
	if ( !isInView(jQuery(this.element)) ){
		endedAction += ' (Not In View)';
	}

	if ( thisVideo.autoplay ){
		endedAction += ' (Autoplay)';
	}

	ga('send', 'event', 'Videos', endedAction, thisVideo.title, {'nonInteraction': true});
	ga('send', 'timing', 'Videos', 'Ended', Math.round(thisVideo.watched*1000), thisVideo.title); //Roughly amount of time watched (Can not be over 100% for Vimeo)
	nv('event', 'Video Ended: ' + thisVideo.title);
	nebula.dom.document.trigger('nebula_ended_video', thisVideo);
}

function addVimeoPlayer(id, element){
	nebula.videos[id] = {
		'player': new Vimeo.Player(element),
		'element': element
	};

	nebula.videos[id].player.on('loaded', vimeoReady);
	nebula.videos[id].player.on('play', vimeoPlay);
	nebula.videos[id].player.on('timeupdate', vimeoTimeUpdate);
	nebula.videos[id].player.on('pause', vimeoPause);
	nebula.videos[id].player.on('seeked', vimeoSeeked);
	nebula.videos[id].player.on('ended', vimeoEnded);
}


//Pause all videos
//Use class "ignore-visibility" on iframes to allow specific videos to continue playing regardless of page visibility
//Pass force as true to pause no matter what.
function pauseAllVideos(force){
	if ( typeof nebula.videos === 'undefined' ){
		return false; //If videos don't exist, then no need to pause
	}

	if ( typeof force === 'null' ){
		force = false;
	}

	jQuery.each(nebula.videos, function(){
		if ( this.platform === 'html5' ){
			if ( (force || !jQuery(this.element).hasClass('ignore-visibility')) ){
				jQuery(this.element)[0].pause(); //Pause HTML5 Videos
			}
		}

		if ( this.platform === 'youtube' ){
			if ( (force || !jQuery(this.element).hasClass('ignore-visibility')) ){
				this.player.pauseVideo(); //Pause Youtube Videos
			}
		}

		if ( this.platform === 'vimeo' ){
			if ( (force || !jQuery(this.element).hasClass('ignore-visibility')) ){
				this.player.pause(); //Pause Vimeo Videos
			}
		}
	});
}

//Create desktop notifications
function desktopNotification(title, message, clickCallback, showCallback, closeCallback, errorCallback){
	if ( checkNotificationPermission() ){
		//Set defaults
		var defaults = {
			dir: "auto", //Direction ["auto", "ltr", "rtl"] (optional)
			lang: "en-US", //Language (optional)
			body: "", //Body message (optional)
			tag: Math.floor(Math.random()*10000)+1, //Unique tag for notification. Prevents repeat notifications of the same tag. (optional)
			icon: nebula.site.directory.template.uri + "/assets/img/meta/android-chrome-192x192.png" //Thumbnail Icon (optional)
		}

		if ( typeof message === "undefined" ){
			message = defaults;
		} else if ( typeof message === "string" ){
			body = message;
			message = defaults;
			message.body = body;
		} else {
			if ( typeof message.dir === "undefined" ){
				message.dir = defaults.dir;
			}
			if ( typeof message.lang === "undefined" ){
				message.lang = defaults.lang;
			}
			if ( typeof message.body === "undefined" ){
				message.body = defaults.lang;
			}
			if ( typeof message.tag === "undefined" ){
				message.tag = defaults.tag;
			}
			if ( typeof message.icon === "undefined" ){
				message.icon = defaults.icon;
			}
		}

		instance = new Notification(title, message); //Trigger the notification

		if ( clickCallback ){
			instance.onclick = function(){
				clickCallback();
			};
		}
		if ( showCallback ){
			instance.onshow = function(e){
				showCallback();
			};
		} else {
			instance.onshow = function(e){
				setTimeout(function(){
					instance.close();
				}, 20000);
			}
		}
		if ( closeCallback ){
			instance.onclose = function(){
				closeCallback();
			};
		}
		if ( errorCallback ){
			instance.onerror = function(){
				ga('send', 'exception', {'exDescription': '(JS) Desktop Notification error', 'exFatal': false});
				errorCallback();
			};
		}
	}

	return false;
}

function checkNotificationPermission(){
	Notification = window.Notification || window.mozNotification || window.webkitNotification;
	if ( !(Notification) ){
		return false;
	} else if ( Notification.permission === "granted" ){
		return true;
	} else if ( Notification.permission !== 'denied' ){
		Notification.requestPermission(function (permission){
			if( !('permission' in Notification) ){ //Firefox and Chrome only
				Notification.permission = permission;
			}
			if ( permission === 'granted' ){
				return true;
			}
		});
	}
	return false;
}

function nebulaVibrate(pattern){
	if ( typeof pattern !== 'object' ){
		pattern = [100, 200, 100, 100, 75, 25, 100, 200, 100, 500, 100, 200, 100, 500];
	}
	if ( navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate ){
		navigator.vibrate(pattern);
	}
	return false;
}

function moreEvents(bool){
	if ( !bool ){
		jQuery('#load-more-events').addClass('all-events-loaded');
	} else {
		jQuery('#load-more-events').removeClass('all-events-loaded');
	}
}

//Show/Hide the reset button
function eventFormNeedReset(){
	hasValue = false;

	//Check the category select dropdown
/*
	jQuery('#advanced-search-form select').each(function(){
		if ( jQuery(this).find('option:selected').val() && jQuery(this).find('option:selected').val() != '' ){
			jQuery('.resetfilters').addClass('active');
			hasValue = true;
			return false;
		}
	});
*/

	//@TODO "Nebula" 0: This is not disappearing when reset link itself is clicked.
	//Check all other inputs
	jQuery('#advanced-search-form input').each(function(){
		if ( (jQuery(this).attr('type') !== 'checkbox' && jQuery(this).val() !== '') || jQuery(this).prop("checked") ){
			jQuery('.resetfilters').addClass('active');
			hasValue = true;
			return false;
		}
	});

	if ( !hasValue ){
		jQuery('.resetfilters').removeClass('active');
	}
}

function mmenus(){
	//@todo "Nebula" 0: Between Mmenu and jQuery, 2 console violations are being triggered: "Added non-passive event listener to a scroll-blocking 'touchmove' event."
		//This happens whether this function is triggered on DOM ready or Window load

	if ( 'mmenu' in jQuery ){
		var mobileNav = jQuery('#mobilenav');
		var mobileNavTriggerIcon = jQuery('a.mobilenavtrigger i');

		if ( mobileNav.length ){
			//Navigation Panels
			var navPanels = {}
			if ( jQuery('#utility-panel').length ){
				navPanels = {
					position: "top",
					type: "tabs",
					content: [
						"<a href='#main-panel'>Main Menu</a>",
						"<a href='#utility-panel'>Other Links</a>"
					]
				}
			}

			//Add social links to footer of Mmenu
			var footerIconLinks = {};
			if ( has(nebula, 'site.options') ){
				footerIconLinks = {
					position: "bottom",
					content: []
				};
				if ( nebula.site.options.facebook_url ){
					footerIconLinks.content.push('<a href="' + nebula.site.options.facebook_url + '" target="_blank" rel="noopener"><i class="fab fa-facebook"></i></a>');
				}

				if ( nebula.site.options.twitter_url ){
					footerIconLinks.content.push('<a href="' + nebula.site.options.twitter_url + '" target="_blank" rel="noopener"><i class="fab fa-twitter"></i></a>');
				}

				if ( nebula.site.options.instagram ){
					footerIconLinks.content.push('<a href="' + nebula.site.options.instagram + '" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>');
				}

				if ( nebula.site.options.linkedin_url ){
					footerIconLinks.content.push('<a href="' + nebula.site.options.linkedin_url + '" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i></a>');
				}

				if ( nebula.site.options.youtube_url ){
					footerIconLinks.content.push('<a href="' + nebula.site.options.youtube_url + '" target="_blank" rel="noopener"><i class="fab fa-youtube"></i></a>');
				}

				if ( nebula.site.options.pinterest_url ){
					footerIconLinks.content.push('<a href="' + nebula.site.options.pinterest_url + '" target="_blank" rel="noopener"><i class="fab fa-pinterest"></i></a>');
				}

				if ( footerIconLinks.content.length > 0 ){
					footerIconLinks.content.splice(0, 0, '<a href="' + nebula.site.home_url + '"><i class="fas fa-home"></i></a>'); //Insert into beginning of array
				}
			}

			//Initialize Mmenu options and configuration
			mobileNav.mmenu({
				//Options
				offCanvas: {
					position: "left", //"left" (default), "right", "top", "bottom"
					zposition: "back", //"back" (default), "front", "next"
				},
				navbars: [{
					position: "top",
					content: ["searchfield"],
				},
				navPanels,
				footerIconLinks
				],
				searchfield: {
					add: true,
					search: true,
					placeholder: 'Search',
					noResults: "No navigation items found.",
					showSubPanels: false,
					showTextItems: false,
					resultsPanel: true,
				},
				counters: true, //Display count of sub-menus
				iconPanels: true, //Layer panels on top of each other
				backButton: {
					close: true //Close the Mmenu on back button click
				},
				extensions: [
					"theme-light", //Light background
					//"fx-listitems-slide", //Animated list items //@todo "Nebula" 0: Test if this is is laggy on mobile devices
					"shadow-page", //Add shadow to the page
					"shadow-panels", //Add shadow to menu panels
					"listview-huge", //Larger list items
					"multiline" //Wrap long titles
				],
			}, {
				//Configuration
				offCanvas: {
					pageSelector: "#body-wrapper"
				},
				classNames: {
					selected: "current-menu-item"
				},
				searchfield: {
					clear: true,
					form: {
						method: "get",
						action: nebula.site.home_url,
					},
					input: {
						name: "s",
					}
				}
			}); //Initialize Mmenu

			if ( mobileNav.length ){
				mobileNav.data('mmenu').bind('open:start', function($panel){
					//When mmenu has started opening
					mobileNavTriggerIcon.removeClass('fa-bars').addClass('fa-times');
					jQuery('[data-toggle="tooltip"]').tooltip('hide');
					nebulaTimer('mmenu', 'start');
				}).bind('close:start', function($panel){
					//When mmenu has started closing
					mobileNavTriggerIcon.removeClass('fa-times').addClass('fa-bars');
					ga('send', 'timing', 'Mmenu', 'Closed', Math.round(nebulaTimer('mmenu', 'lap')), 'From opening mmenu until closing mmenu');
				});
			}

			nebula.dom.document.on('click', '.mm-menu li a:not(.mm-next)', function(){
				ga('send', 'timing', 'Mmenu', 'Navigated', Math.round(nebulaTimer('mmenu', 'lap')), 'From opening mmenu until navigation');
			});
		}
	}
}

//Vertical subnav expanders
function subnavExpanders(){
	if ( nebula.site.options.sidebar_expanders && jQuery('#sidebar-section .menu').length ){
		jQuery('#sidebar-section .menu li.menu-item:has(ul)').addClass('has-expander').append('<a class="toplevelvert_expander closed" href="#"><i class="fas fa-caret-left"></i> <span class="sr-only">Expand</span></a>');
		jQuery('.toplevelvert_expander').parent().children('.sub-menu').hide();
		nebula.dom.document.on('click', '.toplevelvert_expander', function(){
			jQuery(this).toggleClass('closed open').parent().children('.sub-menu').slideToggle();
			return false;
		});
		//Automatically expand subnav to show current page
		jQuery('.current-menu-ancestor').children('.toplevelvert_expander').click();
		jQuery('.current-menu-item').children('.toplevelvert_expander').click();
	}
}

/*==========================
 Extension Functions
 ===========================*/

//Custom CSS expression for a case-insensitive contains(). Source: https://css-tricks.com/snippets/jquery/make-jquery-contains-case-insensitive/
//Call it with :Contains() - Ex: ...find("*:Contains(" + jQuery('.something').val() + ")")... -or- use the nebula function: keywordSearch(container, parent, value);
jQuery.expr[":"].Contains=function(e,n,t){return(e.textContent||e.innerText||"").toUpperCase().indexOf(t[3].toUpperCase())>=0};

//Escape required characters from a provided string. https://github.com/kvz/locutus
function preg_quote(str, delimiter){return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');}

//Parse dates (equivalent of PHP function). https://github.com/kvz/locutus
function strtotime(e,t){var a,n,r,s,u,i,o,w,c,d,D,g=!1;if(!e)return g;e=e.replace(/^\s+|\s+$/g,"").replace(/\s{2,}/g," ").replace(/[\t\r\n]/g,"").toLowerCase();var l=new RegExp(["^(\\d{1,4})","([\\-\\.\\/:])","(\\d{1,2})","([\\-\\.\\/:])","(\\d{1,4})","(?:\\s(\\d{1,2}):(\\d{2})?:?(\\d{2})?)?","(?:\\s([A-Z]+)?)?$"].join(""));if((n=e.match(l))&&n[2]===n[4])if(n[1]>1901)switch(n[2]){case"-":return n[3]>12||n[5]>31?g:new Date(n[1],parseInt(n[3],10)-1,n[5],n[6]||0,n[7]||0,n[8]||0,n[9]||0)/1e3;case".":return g;case"/":return n[3]>12||n[5]>31?g:new Date(n[1],parseInt(n[3],10)-1,n[5],n[6]||0,n[7]||0,n[8]||0,n[9]||0)/1e3}else if(n[5]>1901)switch(n[2]){case"-":case".":return n[3]>12||n[1]>31?g:new Date(n[5],parseInt(n[3],10)-1,n[1],n[6]||0,n[7]||0,n[8]||0,n[9]||0)/1e3;case"/":return n[1]>12||n[3]>31?g:new Date(n[5],parseInt(n[1],10)-1,n[3],n[6]||0,n[7]||0,n[8]||0,n[9]||0)/1e3}else switch(n[2]){case"-":return n[3]>12||n[5]>31||n[1]<70&&n[1]>38?g:(s=n[1]>=0&&n[1]<=38?+n[1]+2e3:n[1],new Date(s,parseInt(n[3],10)-1,n[5],n[6]||0,n[7]||0,n[8]||0,n[9]||0)/1e3);case".":return n[5]>=70?n[3]>12||n[1]>31?g:new Date(n[5],parseInt(n[3],10)-1,n[1],n[6]||0,n[7]||0,n[8]||0,n[9]||0)/1e3:n[5]<60&&!n[6]?n[1]>23||n[3]>59?g:(r=new Date,new Date(r.getFullYear(),r.getMonth(),r.getDate(),n[1]||0,n[3]||0,n[5]||0,n[9]||0)/1e3):g;case"/":return n[1]>12||n[3]>31||n[5]<70&&n[5]>38?g:(s=n[5]>=0&&n[5]<=38?+n[5]+2e3:n[5],new Date(s,parseInt(n[1],10)-1,n[3],n[6]||0,n[7]||0,n[8]||0,n[9]||0)/1e3);case":":return n[1]>23||n[3]>59||n[5]>59?g:(r=new Date,new Date(r.getFullYear(),r.getMonth(),r.getDate(),n[1]||0,n[3]||0,n[5]||0)/1e3)}if("now"===e)return null===t||isNaN(t)?(new Date).getTime()/1e3|0:0|t;if(!isNaN(a=Date.parse(e)))return a/1e3|0;if(l=new RegExp(["^([0-9]{4}-[0-9]{2}-[0-9]{2})","[ t]","([0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?)","([\\+-][0-9]{2}(:[0-9]{2})?|z)"].join("")),(n=e.match(l))&&("z"===n[4]?n[4]="Z":n[4].match(/^([+-][0-9]{2})$/)&&(n[4]=n[4]+":00"),!isNaN(a=Date.parse(n[1]+"T"+n[2]+n[4]))))return a/1e3|0;function f(e){var t,a,n,r,s=e.split(" "),w=s[0],c=s[1].substring(0,3),d=/\d+/.test(w),D="ago"===s[2],g=("last"===w?-1:1)*(D?-1:1);if(d&&(g*=parseInt(w,10)),o.hasOwnProperty(c)&&!s[1].match(/^mon(day|\.)?$/i))return u["set"+o[c]](u["get"+o[c]]()+g);if("wee"===c)return u.setDate(u.getDate()+7*g);if("next"===w||"last"===w)t=w,a=g,void 0!==(r=i[c])&&(0==(n=r-u.getDay())?n=7*a:n>0&&"last"===t?n-=7:n<0&&"next"===t&&(n+=7),u.setDate(u.getDate()+n));else if(!d)return!1;return!0}if(u=t?new Date(1e3*t):new Date,i={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6},o={yea:"FullYear",mon:"Month",day:"Date",hou:"Hours",min:"Minutes",sec:"Seconds"},d="([+-]?\\d+\\s"+(c="(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)")+"|(last|next)\\s"+c+")(\\sago)?",!(n=e.match(new RegExp(d,"gi"))))return g;for(D=0,w=n.length;D<w;D++)if(!f(n[D]))return g;return u.getTime()/1e3}
