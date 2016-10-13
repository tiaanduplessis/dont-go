<p align="center">
	<a href=""><img width="100%" src="media/leo.gif" alt="Dont go"></a>
</p>

# dont-go :sob:
[![GitHub version](https://badge.fury.io/gh/mightyCrow%2Fdont-go.svg)](https://badge.fury.io/gh/mightyCrow%2Fdont-go)
[![npm version](https://badge.fury.io/js/dont-go.svg)](https://badge.fury.io/js/dont-go)
[![Bower version](https://badge.fury.io/bo/dont-go.svg)](https://badge.fury.io/bo/dont-go)
[![Build Status](https://travis-ci.org/mightyCrow/dont-go.svg?branch=master)](https://travis-ci.org/mightyCrow/dont-go)

A small client-side library with zero dependencies to change the title and/or favicon of the page when it is inactive. Minified version weighs in at a [whopping](http://www.dictionary.com/browse/whopping) **615 Bytes** when gzipped. Note that **You must include a default favicon in your webpage**.
<p align="center">
	<a href=""><img width="80%" src="media/example.png" alt="example"></a>
</p>

## Install
**Install with cdn**

```html
<script src="https://cdn.rawgit.com/mightyCrow/dont-go/master/lib/dont-go.min.js"></script>
```

**Install with Bower**
```sh
$ bower install dont-go
```

**Install with npm**

```sh
$ npm install dont-go
```

**Install with yarn**

```sh
$ yarn add dont-go
```

## Usage
To use, simply call the function with options.
```javascript
dontGo({
	title: 'Alternative title text right here!',
	faviconSrc: 'path/to/Alternative/favicon.ico',
	timeout: 5000 //5 seconds
});
```
The `faviconSrc` property is optional and will keep the same icon if not set.

The `timeout` property is optional, it takes an interval in milliseconds to before title & favicon change.

## Contributing
All Contributions are welcome! Please open up an issue if you would like to help out. :smile:

## License
Created with ♥ by [Tiaan du Plessis](https://github.com/mightyCrow). Licensed under the MIT License.
