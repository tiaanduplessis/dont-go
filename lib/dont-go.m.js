function dontGo(options) {
    if ( options === void 0 ) options = {};

    var defaults = {
        title: "Don't go!",
        faviconSrc: '',
        timeout: 0,
        interval: 1000
    };
    var opts = Object.assign(defaults, options);
    var originalTitle = document.title;
    var favicon;
    var originalFavicon;
    var img;
    var timeout;
    var interval;
    var counter = 0;
    if (document.querySelectorAll('link[rel$="icon"]').length) {
        favicon = document.querySelector('link[rel$="icon"]');
        originalFavicon = favicon.getAttribute('href');
    }
    if (opts.faviconSrc.length) {
        img = new Image();
        img.src = opts.faviconSrc;
    }
    var setHidden = function () {
        if (typeof opts.title === 'string') {
            document.title = opts.title;
        } else {
            document.title = opts.title[0];
            interval = setInterval(nextTitle, opts.interval);
        }
        if (opts.faviconSrc.length) {
            favicon.setAttribute('href', opts.faviconSrc);
        }
    };
    var nextTitle = function () {
        counter++;
        if (counter >= opts.title.length) {
            counter = 0;
        }
        document.title = opts.title[counter];
    };
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            if (opts.timeout > 0) {
                timeout = setTimeout(setHidden, opts.timeout);
            } else {
                setHidden();
            }
        } else {
            document.title = originalTitle;
            favicon.setAttribute('href', originalFavicon);
            clearTimeout(timeout);
            clearInterval(interval);
        }
    });
}

export default dontGo;
//# sourceMappingURL=dont-go.m.js.map
