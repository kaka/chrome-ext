const TARGET_VERSION = 1; // Increment when changing target structure

function Target({name, url, searchTerms, details, deeplink}) {
    this.name = name.replace(/\s+/g, " ");
    this.url = url;
    this.searchTerms = (searchTerms && searchTerms.replace(/\s+/g, " ")) || this.name;
    this.details = details || null;
    this.deeplink = deeplink ? new Deeplink(deeplink) : null;
    this.match = null;
    if (this.deeplink && !this.deeplink.url) this.deeplink = undefined;
}

Target.prototype.deeplinkShorthandMatches = function(text) {
    return this.deeplink && this.deeplink.shorthandMatches(text);
}

Target.prototype.getDeeplinkUrl = function(text) {
    return this.deeplink.url.includes("<replace>")
	? this.deeplink.url.replace("<replace>", encodeURI(text))
	: text.replace(this.deeplink.shorthand, this.deeplink.url.replace(/<(\$[0-9]+)>/g, "$1"));
}

Target.prototype.openDeeplink = function(text) {
    window.open(this.getDeeplinkUrl(text));
}

Target.prototype.activate = function() {
    if (this.url) {
	window.open(this.url);
    } else {
	notifyError("<p>Den h�r posten g�r inte att �ppna</p>"); // TODO remove this reference to popup.js
    }
}

Target.prototype.getNormalizedUrl = function() {
    return this.url ? this.url.replace(/(^https?:\/\/)|(\/$)/g, "") : null;
}

Target.prototype.shouldMergeWith = function(other) {
    let urlA = (this.deeplink || {url: null}).url;
    let urlB = (other.deeplink || {url: null}).url;
    return urlA == null || urlB == null || urlA == urlB;
}

Target.prototype.merge = function(other) {
    let searchTerms = new Set(this.searchTerms.split(",").concat(other.searchTerms.split(",")));
    this.searchTerms = Array.from(searchTerms).join(",");
    this.details = (this.details || "") + (other.details || "");
}

function Deeplink({url, shorthand, placeholder, description}) {
    this.url = url;
    this.shorthand = shorthand || null;
    this.placeholder = placeholder || null;
    this.description = description || null;
    if (this.shorthand && typeof this.shorthand === "string") this.shorthand = new RegExp("^" + this.shorthand + "$");
}

Deeplink.prototype.shorthandMatches = function(text) {
    return this.shorthand && this.shorthand.test(text);
}

function Match(args) {
    this.text = args.text;	 // the matched text
    this.indices = args.indices; // the matched indices of the text
}
