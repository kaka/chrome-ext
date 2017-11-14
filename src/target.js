const TARGET_VERSION = 1; // Increment when changing target structure

function Target({name, url, searchTerms, details, deeplink}) {
    this.name = name;
    this.url = url;
    this.searchTerms = searchTerms || null;
    this.details = details || null;
    this.deeplink = deeplink ? new Deeplink(deeplink) : null;
    this.match = null;
}

Target.prototype.deeplinkShorthandMatches = function(text) {
    return this.deeplink && this.deeplink.shorthandMatches(text);
}

Target.prototype.getDeeplinkUrl = function(text) {
    return this.deeplink.url.replace("<replace>", text);
}

Target.prototype.getNormalizedUrl = function() {
    var url = this.deeplink ? this.deeplink.url : (this.url ? this.url : null);
    return url ? url.replace(/(^https?:\/\/)|(\/$)/g, "") : null;
}

function Deeplink({url, shorthand, placeholder, description}) {
    this.url = url;
    this.shorthand = shorthand || null;
    this.placeholder = placeholder || null;
    this.description = description || null;
}

Deeplink.prototype.shorthandMatches = function(text) {
    return this.shorthand && this.shorthand.test(text);
}

function Match(args) {
    this.text = args.text;	 // the matched text
    this.indices = args.indices; // the matched indices of the text
}
