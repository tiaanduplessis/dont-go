const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')

const root = path.join(__dirname, '..')
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
const browser = require('../package.json').browser

test('the CDN example pins a version and loads the browser bundle', () => {
  const script = readme.match(/<script src="https:\/\/unpkg\.com\/([^/]+)\/([^"]+)"><\/script>/)
  assert.ok(script, 'README includes an unpkg script example')
  assert.equal(script[1], 'dont-go@1.1.1')
  assert.equal(script[2], browser)
})

test('the UMD bundle works as a plain script without a module loader', () => {
  const listeners = new Map()
  const favicon = {
    href: 'original.ico',
    getAttribute (name) { assert.equal(name, 'href'); return this.href },
    setAttribute (name, value) { assert.equal(name, 'href'); this.href = value }
  }
  const document = {
    title: 'Original title',
    visibilityState: 'visible',
    querySelector (selector) {
      assert.equal(selector, 'link[rel$="icon"]')
      return favicon
    },
    querySelectorAll (selector) {
      assert.equal(selector, 'link[rel$="icon"]')
      return [favicon]
    },
    addEventListener (name, listener) { listeners.set(name, listener) },
    removeEventListener (name, listener) {
      if (listeners.get(name) === listener) listeners.delete(name)
    }
  }
  // These owned mocks never fetch images, schedule work, or use browser APIs.
  const window = {
    document,
    Image: function () {},
    setTimeout () { assert.fail('a static update needs no timeout') },
    setInterval () { assert.fail('a static update needs no interval') },
    clearTimeout () {},
    clearInterval () {}
  }
  window.window = window
  const bundle = fs.readFileSync(path.join(root, browser), 'utf8')
  vm.runInNewContext(bundle, window, { filename: browser, timeout: 1000 })
  assert.equal(typeof window.dontGo, 'function')
  assert.equal(typeof window.module, 'undefined')
  assert.equal(typeof window.exports, 'undefined')
  assert.equal(typeof window.define, 'undefined')

  window.dontGo({ title: 'Come back', faviconSrc: 'away.ico' })
  assert.equal(document.title, 'Original title')
  assert.equal(favicon.href, 'original.ico')
  const onVisibilityChange = listeners.get('visibilitychange')
  assert.equal(typeof onVisibilityChange, 'function')

  for (let i = 0; i < 2; i++) {
    document.visibilityState = 'hidden'
    onVisibilityChange()
    assert.equal(document.title, 'Come back')
    assert.equal(favicon.href, 'away.ico')
    document.visibilityState = 'visible'
    onVisibilityChange()
    assert.equal(document.title, 'Original title')
    assert.equal(favicon.href, 'original.ico')
  }
})
