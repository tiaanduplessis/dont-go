<p align="center">
	<a href=""><img width="100%" src="media/leo.gif" alt="Dont go"></a>
</p>

# dont-go :sob:

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

A small client-side library with zero dependencies to change the title and/or favicon of the page when it is inactive. Minified version weighs in at a [whopping](http://www.dictionary.com/browse/whopping) **1.08 kB**. Note that **You must include a default favicon in your webpage**.
<p align="center">
	<a href=""><img width="100%" src="media/example.png" alt="example"></a>
</p>

## Install
**Install with cdn**

```html
<link rel="stylesheet" href="">
```

**Install with Bower**
```sh
$ bower install dont-go
```

**Install with npm**

```sh
$ npm install dont-go
```

## Usage
To use, simply call the function with options.
```javascript
dontGo({
	title: 'Alternative title text right here!',
	faviconSrc: 'path/to/Alternative/favicon.ico'
});
```

## Contributing
All Contributions are welcome! Please open up an issue if you would like to help out. :smile:

## License
Created with ♥ by [Tiaan du Plessis](https://github.com/mightyCrow). Licensed under the MIT License.
