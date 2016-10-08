export default function dontGo(options = {}) {
  const defaults = {
    title: 'Don\'t go!',
    faviconSrc: '',
    timeout: 0
  };

  const opts = Object.assign(defaults, options);
  const originalTitle = document.title;
  let favicon;
  let originalFavicon;
  let img;

  // Store the original favicon if it exists
  if (document.querySelectorAll('link[rel$="icon"]').length) {
    favicon = document.querySelectorAll('link[rel$="icon"]')[0];
    originalFavicon = favicon.getAttribute('href');
  }

  // Preload the alternative favicon
  if (opts.faviconSrc.length) {
    img = new Image();
    img.src = opts.faviconSrc;
  }

  document.addEventListener("visibilitychange", () => {
    // Make sure we ignore timeout when coming back
    if(document.visibilityState == 'hidden' && opts.timeout > 0) {
      setTimeout(onChange, opts.timeout);
    }
    else {
      onChange();
    }
  });

  let onChange = () => {
    // Change the title
    document.title = (document.hidden) ? opts.title : originalTitle

    // Change favicon if enabled
    if (opts.faviconSrc.length) {
      favicon.setAttribute('href',   (document.hidden) ? opts.faviconSrc : originalFavicon)
    }
  }

}
