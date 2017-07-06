module.exports = function dontGo (options = {}) {
  const defaults = {
    title: 'Don\'t go!',
    faviconSrc: '',
    timeout: 0,
    interval: 1000
  }

  const opts = Object.assign(defaults, options)
  const originalTitle = document.title
  let favicon
  let originalFavicon
  let img
  let timeout
  let interval
  let counter = 0

  // Store the original favicon if it exists
  if (document.querySelectorAll('link[rel$="icon"]').length) {
    favicon = document.querySelector('link[rel$="icon"]')
    originalFavicon = favicon.getAttribute('href')
  }

  // Preload the alternative favicon
  if (opts.faviconSrc.length) {
    img = new Image()  // eslint-disable-line
    img.src = opts.faviconSrc
  }

  const setHidden = () => {
    // if title is string just switch the title
    if (typeof opts.title === 'string') {
      document.title = opts.title
    } else {
      document.title = opts.title[0]
      interval = setInterval(nextTitle, opts.interval)
    }

    if (opts.faviconSrc.length) {
      favicon.setAttribute('href', opts.faviconSrc)
    }
  }

  const nextTitle = () => {
    counter++
    if (counter >= opts.title.length) {
      counter = 0
    }
    document.title = opts.title[counter]
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (opts.timeout > 0) {
        timeout = setTimeout(setHidden, opts.timeout)
      } else {
        setHidden()
      }
    } else {
      document.title = originalTitle
      favicon.setAttribute('href', originalFavicon)
      clearTimeout(timeout)
      clearInterval(interval)
    }
  })
}
