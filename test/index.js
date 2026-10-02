const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const { JSDOM } = require('jsdom')
const FakeTimers = require('@sinonjs/fake-timers')

const source = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8')

function setup (t, { icon = '<link rel="icon" href="original.ico">', fakeTimers = true } = {}) {
  const dom = new JSDOM(`<title>Original title</title>${icon}`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'https://example.test/'
  })
  const { window } = dom
  const { document } = window
  let visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { get: () => visibility })
  const clock = fakeTimers && FakeTimers.withGlobal(window).install()
  const images = []
  window.Image = function () {
    const image = document.createElement('img')
    images.push(image)
    return image
  }
  window.eval(source.replace('export default dontGo', 'window.dontGo = dontGo'))
  let stop
  t.after(() => {
    if (stop) stop()
    if (clock) clock.uninstall()
    window.close()
  })
  return {
    window,
    document,
    clock,
    images,
    start (options) { stop = window.dontGo(options); return stop },
    visibility (state) {
      visibility = state
      document.dispatchEvent(new window.Event('visibilitychange'))
    },
    title () { return document.title },
    icon () { return document.querySelector('link[rel$="icon"]').getAttribute('href') }
  }
}

test('defaults and a single favicon retain their existing behavior', t => {
  const page = setup(t)
  page.start({ faviconSrc: 'away.ico' })
  assert.equal(page.title(), 'Original title')
  assert.equal(page.images[0].getAttribute('src'), 'away.ico')
  page.visibility('hidden')
  assert.equal(page.title(), "Don't go!")
  assert.equal(page.icon(), 'away.ico')
  assert.equal(page.clock.countTimers(), 0)
  page.visibility('visible')
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
})

test('title arrays keep their interval and restart from the first title', t => {
  const page = setup(t)
  page.start({ title: ['One', 'Two', 'Three'], interval: 100 })
  page.visibility('hidden')
  assert.equal(page.title(), 'One')
  page.clock.tick(99)
  assert.equal(page.title(), 'One')
  page.clock.tick(1)
  assert.equal(page.title(), 'Two')
  page.visibility('visible')
  page.visibility('hidden')
  assert.equal(page.title(), 'One')
  page.clock.tick(100)
  assert.equal(page.title(), 'Two')
  page.clock.tick(200)
  assert.equal(page.title(), 'One')
})

test('favicons rotate with a static title and preload each alternative', t => {
  const page = setup(t)
  page.start({ title: 'Away', faviconSrc: ['one.ico', 'two.ico'], interval: 100 })
  assert.deepEqual(page.images.map(image => image.getAttribute('src')), ['one.ico', 'two.ico'])
  page.visibility('hidden')
  assert.equal(page.icon(), 'one.ico')
  page.clock.tick(100)
  assert.equal(page.icon(), 'two.ico')
  assert.equal(page.title(), 'Away')
  page.clock.tick(100)
  assert.equal(page.icon(), 'one.ico')
  page.visibility('visible')
  page.clock.tick(1000)
  assert.equal(page.icon(), 'original.ico')
  assert.equal(page.title(), 'Original title')
  assert.equal(page.clock.countTimers(), 0)
})

test('a failed preload does not interrupt rotation or restoration', t => {
  const page = setup(t)
  page.start({ faviconSrc: ['missing.ico', 'two.ico'], interval: 100 })
  page.images[0].dispatchEvent(new page.window.Event('error'))
  page.visibility('hidden')
  assert.equal(page.icon(), 'missing.ico')
  page.clock.tick(100)
  assert.equal(page.icon(), 'two.ico')
  page.visibility('visible')
  assert.equal(page.icon(), 'original.ico')
  assert.equal(page.clock.countTimers(), 0)
})

test('default interval is one second and favicon cycles restart at the first URL', t => {
  const page = setup(t)
  page.start({ faviconSrc: ['one.ico', 'two.ico', 'three.ico'] })
  page.visibility('hidden')
  page.clock.tick(999)
  assert.equal(page.icon(), 'one.ico')
  page.clock.tick(1)
  assert.equal(page.icon(), 'two.ico')
  page.visibility('visible')
  page.visibility('hidden')
  assert.equal(page.icon(), 'one.ico')
  page.clock.tick(1000)
  assert.equal(page.icon(), 'two.ico')
})

test('title and favicon arrays advance together and wrap independently', t => {
  const page = setup(t)
  page.start({ title: ['One', 'Two', 'Three'], faviconSrc: ['one.ico', 'two.ico'], interval: 50 })
  page.visibility('hidden')
  assert.equal(page.clock.countTimers(), 1)
  const expected = [['One', 'one.ico'], ['Two', 'two.ico'], ['Three', 'one.ico'], ['One', 'two.ico'], ['Two', 'one.ico']]
  expected.forEach(([title, icon], index) => {
    if (index) page.clock.tick(50)
    assert.equal(page.title(), title)
    assert.equal(page.icon(), icon)
  })
})

test('a static favicon is not repeatedly reassigned when titles rotate', t => {
  const page = setup(t)
  page.start({ title: ['One', 'Two'], faviconSrc: 'away.ico', interval: 100 })
  const observer = new page.window.MutationObserver(() => {})
  t.after(() => observer.disconnect())
  observer.observe(page.document.querySelector('link'), { attributes: true })
  page.visibility('hidden')
  assert.equal(observer.takeRecords().length, 1)
  page.clock.tick(1000)
  assert.equal(observer.takeRecords().length, 0)
  assert.equal(page.icon(), 'away.ico')
  page.visibility('visible')
  assert.equal(page.icon(), 'original.ico')
})

test('single-element arrays remain static without an interval', t => {
  const page = setup(t)
  page.start({ title: ['Away'], faviconSrc: ['away.ico'] })
  page.visibility('hidden')
  assert.equal(page.title(), 'Away')
  assert.equal(page.icon(), 'away.ico')
  assert.equal(page.clock.countTimers(), 0)
})

test('timeout delays both arrays and starts the interval after the first update', t => {
  const page = setup(t)
  page.start({ title: ['One', 'Two'], faviconSrc: ['one.ico', 'two.ico'], timeout: 200, interval: 100 })
  page.visibility('hidden')
  page.clock.tick(199)
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
  page.clock.tick(1)
  assert.equal(page.title(), 'One')
  assert.equal(page.icon(), 'one.ico')
  page.clock.tick(99)
  assert.equal(page.icon(), 'one.ico')
  page.clock.tick(1)
  assert.equal(page.title(), 'Two')
  assert.equal(page.icon(), 'two.ico')
})

test('returning before the timeout cancels all pending changes', t => {
  const page = setup(t)
  page.start({ faviconSrc: ['one.ico', 'two.ico'], timeout: 200, interval: 100 })
  page.visibility('hidden')
  page.clock.tick(100)
  page.visibility('visible')
  page.clock.tick(1000)
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
  assert.equal(page.clock.countTimers(), 0)
})

test('duplicate hidden events cannot duplicate delays or rotation timers', t => {
  const page = setup(t)
  page.start({ faviconSrc: ['one.ico', 'two.ico'], timeout: 200, interval: 100 })
  page.visibility('hidden')
  page.clock.tick(100)
  page.visibility('hidden')
  assert.equal(page.clock.countTimers(), 1)
  page.clock.tick(100)
  assert.equal(page.icon(), 'one.ico')
  page.visibility('hidden')
  assert.equal(page.clock.countTimers(), 1)
  page.clock.tick(100)
  assert.equal(page.icon(), 'two.ico')
  page.visibility('visible')
  assert.equal(page.clock.countTimers(), 0)
})

test('focus and blur alone keep the visibility-based behavior unchanged', t => {
  const page = setup(t)
  page.start({ faviconSrc: ['one.ico', 'two.ico'] })
  page.window.dispatchEvent(new page.window.Event('blur'))
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
  page.visibility('hidden')
  page.window.dispatchEvent(new page.window.Event('focus'))
  assert.equal(page.icon(), 'one.ico')
  page.visibility('visible')
  assert.equal(page.icon(), 'original.ico')
})

test('missing favicons do not break title changes, restoration, or cleanup', t => {
  const page = setup(t, { icon: '' })
  const stop = page.start({ title: ['One', 'Two'], faviconSrc: ['one.ico', 'two.ico'], interval: 50 })
  page.visibility('hidden')
  assert.equal(page.title(), 'One')
  page.clock.tick(50)
  assert.equal(page.title(), 'Two')
  page.visibility('visible')
  assert.equal(page.title(), 'Original title')
  assert.equal(page.document.querySelector('link'), null)
  assert.equal(page.images.length, 0)
  stop()
  assert.equal(page.clock.countTimers(), 0)
})

test('favicon-only rotation does not start a timer when the icon is missing', t => {
  const page = setup(t, { icon: '' })
  page.start({ title: [], faviconSrc: ['one.ico', 'two.ico'] })
  page.visibility('hidden')
  assert.equal(page.title(), 'Original title')
  assert.equal(page.clock.countTimers(), 0)
})

test('restoration preserves an absent href and shortcut icon markup', t => {
  const page = setup(t, { icon: '<link rel="shortcut icon">' })
  page.start({ faviconSrc: ['one.ico', 'two.ico'] })
  page.visibility('hidden')
  assert.equal(page.icon(), 'one.ico')
  page.visibility('visible')
  assert.equal(page.icon(), null)
})

test('empty or unsupported values leave the corresponding original unchanged', t => {
  const page = setup(t)
  for (const value of [[], null, undefined, 42, {}, [null, 42]]) {
    page.start({ title: value, faviconSrc: value })
    page.visibility('hidden')
    assert.equal(page.title(), 'Original title')
    assert.equal(page.icon(), 'original.ico')
    assert.equal(page.clock.countTimers(), 0)
    page.visibility('visible')
  }
  page.start({ title: '', faviconSrc: '' })
  page.visibility('hidden')
  assert.equal(page.title(), '')
  assert.equal(page.icon(), 'original.ico')
})

test('configuration arrays are copied and invalid entries are ignored', t => {
  const page = setup(t)
  const titles = ['One', null, 'Two']
  const favicons = ['one.ico', '', undefined, 'two.ico']
  page.start({ title: titles, faviconSrc: favicons, interval: 100 })
  titles[0] = 'Changed'
  favicons.length = 0
  page.visibility('hidden')
  assert.equal(page.title(), 'One')
  assert.equal(page.icon(), 'one.ico')
  page.clock.tick(100)
  assert.equal(page.title(), 'Two')
  assert.equal(page.icon(), 'two.ico')
})

test('cleanup restores originals, removes the listener, and is idempotent', t => {
  const page = setup(t)
  const stop = page.start({ title: ['One', 'Two'], faviconSrc: ['one.ico', 'two.ico'] })
  page.visibility('hidden')
  stop()
  stop()
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
  page.visibility('hidden')
  page.clock.tick(5000)
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
  assert.equal(page.clock.countTimers(), 0)
})

test('cleanup cancels a delayed update before it can run', t => {
  const page = setup(t)
  const stop = page.start({ faviconSrc: ['one.ico', 'two.ico'], timeout: 100 })
  page.visibility('hidden')
  stop()
  page.clock.tick(1000)
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
  assert.equal(page.clock.countTimers(), 0)
})

test('reinitializing replaces pending and active instances without stale cleanup', t => {
  const page = setup(t)
  const oldStop = page.start({ title: ['Old one', 'Old two'], faviconSrc: ['old.ico', 'older.ico'], timeout: 100 })
  page.visibility('hidden')
  page.start({ title: ['New one', 'New two'], faviconSrc: ['new.ico', 'newer.ico'], interval: 50 })
  assert.equal(page.clock.countTimers(), 0)
  assert.equal(page.title(), 'Original title')
  page.visibility('hidden')
  oldStop()
  page.clock.tick(50)
  assert.equal(page.title(), 'New two')
  assert.equal(page.icon(), 'newer.ico')
  assert.equal(page.clock.countTimers(), 1)
  const stop = page.start({ title: 'Latest', faviconSrc: 'latest.ico' })
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
  assert.equal(page.clock.countTimers(), 0)
  page.visibility('hidden')
  assert.equal(page.title(), 'Latest')
  assert.equal(page.icon(), 'latest.ico')
  stop()
  assert.equal(page.title(), 'Original title')
  assert.equal(page.icon(), 'original.ico')
})

test('real DOM timers can rotate favicons and stop after becoming visible', { timeout: 2000 }, async t => {
  const page = setup(t, { fakeTimers: false })
  page.start({ faviconSrc: ['one.ico', 'two.ico'], interval: 10 })
  const rotated = new Promise(resolve => {
    const observer = new page.window.MutationObserver(() => {
      if (page.icon() === 'two.ico') {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(page.document.querySelector('link'), { attributes: true })
    t.after(() => observer.disconnect())
  })
  page.visibility('hidden')
  await rotated
  page.visibility('visible')
  await new Promise(resolve => setTimeout(resolve, 40))
  assert.equal(page.icon(), 'original.ico')
  assert.equal(page.title(), 'Original title')
})
