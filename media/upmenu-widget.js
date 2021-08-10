(function (window, document) {
    var jQuery, $; // localize jQuery variables
    // widget settings
    var STATIC_DIR = 'media/widget';
    var API_CSS_FILE = STATIC_DIR+'/upmenu-widget.css';
    var JQUERY_FILE = STATIC_DIR+'/jquery.3.3.1.min.js';
    var IZI_MODAL_FILE = STATIC_DIR+'/iziModal.1.5.1.js';

	var INLINE_PLACEHOLDER_ID = "upmenu-widget";
	var MODAL_PLACEHOLDER_ID = "upmenu-widget-modal-placeholder";
	var IFRAME_ID = "upmenu-iframe";

	var WIDGET_CLASS = 'upmenu-widget';
    var WIDGET_TRIGGER_CLASS = 'upmenu-widget-show';
    var WIDGET_CLASS_INLINE_BUTTON = 'upmenu-inline-button';

    // iframe settings
	var FIXED_FIXED_OFFEST_TOP_ATTRIBUTE = "data-fixed-offset-top";
	var FIXED_FIXED_TABLET_OFFEST_TOP_ATTRIBUTE = "data-fixed-tablet-offset-top";
	var FIXED_FIXED_MOBILE_OFFEST_TOP_ATTRIBUTE = "data-fixed-mobile-offset-top";
	var FIXED_FIXED_OFFEST_BOTTOM_ATTRIBUTE = "data-fixed-offset-bottom";


	function getSrc() {
	    var src = window.upmenuSettings.config.url;
		if(window.location.href.indexOf('?') != -1) {
             src += '?'+ window.location.href.slice(window.location.href.indexOf('?') + 1);
        }
		return src;
	}
	function getAttribute(attributeName) {
		var iframePlaceholder = document.querySelector('#'+INLINE_PLACEHOLDER_ID);
		if(iframePlaceholder) {} else {
			return "";
		}
		var attribute = iframePlaceholder.getAttribute(attributeName);
		if(attribute) {} else {
			return "";
		}
		return attribute;
	}
	// scroll to
    function setScrollY(y) {
        window.scrollTo(0, y);
    }

    // get iframe by id
    function getIframe() {
        return document.getElementById(IFRAME_ID);
    }

    // get top offset
    function getOffsetTop(element) {
        var offsetTop = element.offsetTop;
        if (typeof element.offsetParent !== 'undefined' && element.offsetParent !== null) {
            offsetTop += getOffsetTop(element.offsetParent);
        }
        return offsetTop;
    }

    // set element height
    function setElementHeight(elem, h) {
        elem.style.height = h + "px";
    }

    // remove element
    function removeElement(selector) {
        var element = document.querySelector(selector);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    // insert element
    function insertElement(selector, node) {
        var element = document.querySelector(selector);
        element.appendChild(node);
    }

    var isScrolling;
    // send message to iframe
    function sendMessageToIframe(type, data) {
        data = data || {};
        var timestamp = new Date().getTime();
        var iframe = getIframe();
        var message = {
            visibility: 'hide'
        }

        if (iframe && iframe.contentWindow) {
	        switch (type) {
		        case 'PARENT_SCROLL':
		            message = {
		                    type: 'PARENT_SCROLL',
		                    iframeParentHeight: window.innerHeight,
		                    iframeOffsetTop: iframe.getBoundingClientRect().top,
		                    iframeOffsetBottom: iframe.getBoundingClientRect().bottom,
		                    iframeFixedOffsetTop: iframe.dataset.fixedOffsetTop,
		                    iframeFixedTabletOffsetTop: iframe.dataset.fixedTabletOffsetTop,
				            iframeFixedMobileOffsetTop: iframe.dataset.fixedMobileOffsetTop,
				            iframeFixedOffsetBottom: iframe.dataset.fixedOffsetBottom
		            };

                    iframe.contentWindow.postMessage(message, "*");

                    window.clearTimeout( isScrolling );
                    isScrolling = setTimeout(function() {
                        message.visibility = 'show';
                        iframe.contentWindow.postMessage(message, "*");
                    }, 200);
                break;
		    }
        }
    }

    // send message to iframe that we are scrolling on the parent
    function sendMessageToIframe_parentScroll() {
        sendMessageToIframe('PARENT_SCROLL');
    }
    // listen to message from iframe
    function onMessageFromIframe(e) {
    	//console.log('onMessageFromIframe('+e.data.type+')');
        var iframe = getIframe();
        switch(e.data.type) {
            case 'SCROLL_PARENT_TO_IFRAME_TOP':
                setScrollY(getOffsetTop(iframe));
                break;
            case 'SCROLL_PARENT_TO_IFRAME_OFFSET':
                setScrollY(e.data.offset + getOffsetTop(iframe));
                break;
            case 'RELOAD_PARENT':
                window.parent.location.assign(e.data.url);
                break;
            case 'FIT_IFRAME_TO_WINDOW':
            	 	var h = parseInt(e.data.document_height);
                if (!isNaN(h)) {
                     setElementHeight(iframe, h );
                     if (e.data.scroll_to_top) {
                    	 	setScrollY(getOffsetTop(iframe));
                     }
                }
                sendMessageToIframe_parentScroll();
                break;
        }
    }

    // initialize
    function initParentListeners() {
        window.addEventListener('message', onMessageFromIframe, false);
        window.addEventListener('scroll', sendMessageToIframe_parentScroll, false);
        window.addEventListener('resize', sendMessageToIframe_parentScroll, false);

        if (window.MutationObserver) { // new feature of listening on some browsers
            var config = { attributes: false, childList: true, characterData: true, subtree: true};
            var observer = new MutationObserver(function (mutations, obs) {
                var iframe = getIframe();
                if (!iframe) {
                    window.removeEventListener('message', onMessageFromIframe, false);
                    window.removeEventListener('scroll', sendMessageToIframe_parentScroll, false);
                    window.removeEventListener('resize', sendMessageToIframe_parentScroll, false);
                    obs.disconnect();
                }
            });
            observer.observe(document.body, config);
        }
    }

    // build iframe element
    function buildIframe() {
    	var iframe = document.createElement("iframe");


        iframe.src = getSrc();
        iframe.id = IFRAME_ID;

        iframe.style.width = "100%";
        iframe.style.height = 0;
        iframe.style.overflow = "hidden";
        iframe.style.display = "block";
        iframe.style.minHeight = '600px';
        iframe.scrolling = "no";
        iframe.frameborder = "0";
        iframe.allowTransparency = "true";
        iframe.allow = "geolocation";
        iframe.style.border = "none";
        iframe.style.margin = "0px";
        iframe.style.maxWidth = "100%";

        iframe.dataset.fixedOffsetTop = getIframeFixedOffsetTop();
        iframe.dataset.fixedTabletOffsetTop = getAttribute(FIXED_FIXED_TABLET_OFFEST_TOP_ATTRIBUTE);
        iframe.dataset.fixedMobileOffsetTop = getAttribute(FIXED_FIXED_MOBILE_OFFEST_TOP_ATTRIBUTE);
        iframe.dataset.fixedOffsetBottom = getAttribute(FIXED_FIXED_OFFEST_BOTTOM_ATTRIBUTE);
        return iframe;
    }

    function getIframeFixedOffsetTop() {
        if (getAttribute(FIXED_FIXED_OFFEST_TOP_ATTRIBUTE)) {
            return getAttribute(FIXED_FIXED_OFFEST_TOP_ATTRIBUTE);
        } else {
            return window.upmenuSettings.config.fixedOffsetTop;
        }
    }

    function loadScript(url, callback){

        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState){  //IE
            script.onreadystatechange = function(){
                if (script.readyState == "loaded" ||
                        script.readyState == "complete"){
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {  //Others
            script.onload = function(){
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    }
    // get button text from settings or rest api settings
    function getButtonText() {
        var text = window.upmenuSettings.config.text;
        /*if(typeof window.upmenuSettings.text != 'undefined') {
            text = window.upmenuSettings.text;
        }*/
        return text;
    }
    function buildStyles() {
        var bgColor = window.upmenuSettings.config.backgroundColor;
        var textColor = window.upmenuSettings.config.textColor;
        /*if(typeof window.upmenuSettings.background_color != 'undefined') {
            bgColor = window.upmenuSettings.background_color;
        }
        if(typeof window.upmenuSettings.text_color != 'undefined') {
            textColor = window.upmenuSettings.text_color;
        }*/
        $("<style type='text/css'>.upmenu-widget { background-color: "+bgColor+"; color: "+textColor+";} .upmenu-widget a { color: "+textColor+"; } </style>").appendTo("head");
    }
    // load css for api
    function buildApiCss() {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = API_CSS_FILE;
        link.media = 'all';
        head.appendChild(link);
    }
    // build modal placeholder
    function buildWidgetPlaceholderDiv() {
        var div = document.createElement("div");
        div.id = MODAL_PLACEHOLDER_ID;
        document.body.appendChild(div);
    }
    // build floating widget
    function buildInvisibleWidget() {
         var div = document.createElement("div");
         div.className = WIDGET_CLASS+" upmenu-custom-link";

        var a = document.createElement('a');
        var linkText = document.createTextNode(getButtonText());
        a.appendChild(linkText);
        a.className = WIDGET_TRIGGER_CLASS;
        a.target = "_blank";
        a.href = getSrc();
        div.appendChild(a);

        document.body.appendChild(div);
    }

    function buildInlineButton() {
        var createDiv = document.createElement("div");
        var linkA = document.createElement('a');
        var linkText = document.createTextNode(getButtonText());

        createDiv.className = WIDGET_CLASS+" upmenu-widget-type-inline-button";

        linkA.appendChild(linkText);
        linkA.className = WIDGET_CLASS_INLINE_BUTTON;
        linkA.target = "_blank";
        linkA.href = getSrc();
        createDiv.appendChild(linkA);
        document.body.appendChild(createDiv);
    }
    // build and insert iframe
    function loadIframe() {
    	var iframe = buildIframe();

    	// iframe was loaded
        function onIframeLoad() {
        		//removeElement("#"+INLINE_PLACEHOLDER_ID); // remove loading message
        		sendMessageToIframe_parentScroll();
        }

        if(iframe.attachEvent) {
            iframe.attachEvent("onload", onIframeLoad);
        } else {
            iframe.onload = onIframeLoad;
        }
        insertElement("#"+INLINE_PLACEHOLDER_ID, iframe);

        initParentListeners();
    }

    // main function
    function main() {
            // load settings
        /*    $.ajax({
                url: 'restapi/widget/config1',
                data:  {
                    siteId: window.upmenuSettings.id,
                    restaurantId: window.upmenuSettings.restaurant_id,
                    pageId: window.upmenuSettings.page_id,
                    language: window.upmenuSettings.language,
                    widgetInstalledOrigin: window.location.href
                },
                dataType: "jsonp",
                jsonp: 'callback',
                type: 'GET'
            }).done(function(data) {

                    window.upmenuSettings.config = data;

                    // handle widget click
                    $(document).on('click', '.'+WIDGET_TRIGGER_CLASS, function (event) {


                            if(window.upmenuSettings.config.newWindow) {
                                // do nothing - default a.href click will take place
                            } else {

                                if ($.fn.iziModal) { // check if iziModal plugin was loaded correctly
                                    event.preventDefault();
                                    $("#"+MODAL_PLACEHOLDER_ID).iziModal('open', event);
                                } else {
                                     // iziModal jquery plugin not loaded correctly. Please contact UpMenu support
                                     // do nothing - default a.href click will take place
                                }
                            }
                    });

                    buildApiCss();
                    buildWidgetPlaceholderDiv();
                    buildStyles();
                        if ($(window).width() <= 768) {
                            var viewPortWidth = window.innerWidth;
                            var $menuWidth = $('#upmenu-widget').outerWidth();
                            var marginNegative = (viewPortWidth - $menuWidth) / 2;
                            $('#upmenu-widget').css({
                                'margin-left': '-' + (marginNegative) + 'px',
                                'margin-right': '-' + (marginNegative) + 'px'
                            });
                        } else {
                            $('#upmenu-widget').removeAttr("style");
                        }
                    if ($.fn.iziModal) { // check if iziModal plugin was loaded correctly
                        $("#"+MODAL_PLACEHOLDER_ID).iziModal({
                          iframe: true,
                          openFullscreen: true,
                          setHeader: true,
                          title: ' ',
                          subtitle: ' ',
                          headerColor: '#f9f9f9',
                          theme: 'light',
                          bodyOverflow: true,
                          closeOnEscape: true,
                          closeButton: true,
                          zindex: 9999999,
                        });
                     }

                    // external buttons if required
                    if($('.upmenu-widget-btn').length > 0) {
                        $('.upmenu-widget-btn').each(function() {
                            $(this).html('<a href="'+getSrc()+'" class="'+WIDGET_CLASS+' upmenu-widget-type-button '+WIDGET_TRIGGER_CLASS+'" target="_blank">'+getButtonText()+'</a>');
                        });
                    }

                     // check if we should use inline (iframe)
                    if(window.upmenuSettings.config.type == 'INLINE_MENU') {
                        if($('#'+INLINE_PLACEHOLDER_ID).length > 0) {
                            loadIframe();
                        }
                    }
                    if(window.upmenuSettings.config.type == 'CUSTOM_LINK') {
                        function addHrefToCustomLink() {
                            var elements = document.querySelectorAll('.upmenu-widget-show');
                            elements.forEach(function(element) {
                                element.href = getSrc()
                            });
                        };
                        addHrefToCustomLink();
                    }
                    if(window.upmenuSettings.config.type == 'INLINE_BUTTON') {
                        buildInlineButton();
                    }
            });*/
    }

    // load jquery
    loadScript(JQUERY_FILE, function() {
        /* restore $ and window.jQuery to their previous values and store the new jQuery in our local jQuery variables. */
        $ = jQuery = window.jQuery.noConflict(true);

        loadScript(IZI_MODAL_FILE, function() {
            initIziModalPlugin(jQuery);
            main();
        });
    });

})(window, document);
