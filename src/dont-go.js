export default function dontGo(options = {}) {
  const defaults = {
    title: "Please don't go!",
    favicon: {
      enabled: false,
      src: ''
    }
  };

  const opts = Object.assign(defaults, options);
  const originalTitle = document.title;
  let favicon;
  let originalFavicon;
  let img;

  if (document.querySelectorAll('link[rel$="icon"]').length) {
    favicon = document.querySelectorAll('link[rel$="icon"]')[0];
    originalFavicon = favicon.getAttribute('href');
  }


  if (opts.favicon.enabled) {
    img = new Image();
    img.src = opts.favicon.src;
  }

  document.addEventListener("visibilitychange", () => {
    // Change the title
    document.title = (document.hidden) ? opts.title : originalTitle

    // Change favicon if enabled
    if (opts.favicon.enabled) {
      favicon.setAttribute('href',   (document.hidden) ? opts.favicon.src : originalFavicon)
    }
  });

}
