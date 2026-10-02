let stopPrevious

function dontGo (options = {}) {
  const defaults = {
    title: "Don't go!",
    faviconSrc: '',
    timeout: 0,
    interval: 1000
  }

  const opts = Object.assign(defaults, options)
  const toArray = value => (Array.isArray(value) ? value : [value])
    .filter(item => typeof item === 'string')
  const titles = toArray(opts.title)
  const favicons = toArray(opts.faviconSrc).filter(Boolean)

  // Reinitializing replaces the previous instance and restores its originals.
  if (stopPrevious) stopPrevious()

  const originalTitle = document.title
  const favicon = document.querySelector('link[rel$="icon"]')
  const originalFavicon = favicon && favicon.getAttribute('href')
  let timeout
  let interval
  let counter = 0
  let hidden = false

  // Preload each alternative favicon if the page has a favicon to update.
  if (favicon) {
    favicons.forEach(src => {
      const img = new Image() // eslint-disable-line
      img.src = src
    })
  }

  const update = () => {
    if (titles.length && (counter === 0 || titles.length > 1)) {
      document.title = titles[counter % titles.length]
    }
    if (favicon && favicons.length && (counter === 0 || favicons.length > 1)) {
      favicon.setAttribute('href', favicons[counter % favicons.length])
    }
    counter++
  }

  const setHidden = () => {
    update()
    if (titles.length > 1 || (favicon && favicons.length > 1)) {
      interval = setInterval(update, opts.interval)
    }
  }

  const restore = () => {
    clearTimeout(timeout)
    clearInterval(interval)
    hidden = false
    counter = 0
    document.title = originalTitle
    if (favicon) {
      if (originalFavicon === null) favicon.removeAttribute('href')
      else favicon.setAttribute('href', originalFavicon)
    }
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Ignore duplicate events, including while the initial delay is pending.
      if (hidden) return
      hidden = true
      if (opts.timeout > 0) {
        timeout = setTimeout(setHidden, opts.timeout)
      } else {
        setHidden()
      }
    } else {
      restore()
    }
  }

  const stop = () => {
    if (stopPrevious !== stop) return
    document.removeEventListener('visibilitychange', onVisibilityChange)
    restore()
    stopPrevious = undefined
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  stopPrevious = stop
  return stop
}

export default dontGo
