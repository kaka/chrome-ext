const TARGET_VERSION = 1; // Increment when changing target structure

function Target(args) {
    this.name = args.name;
    this.url = args.url;
    this.searchTerms = args.searchTerms || null;
    this.details = args.details || null;
    this.deeplink = args.deeplink ? new Deeplink(args.deeplink) : null;
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

function Deeplink(args) {
    this.url = args.url;
    this.shorthand = args.shorthand || null;
    this.placeholder = args.placeholder || null;
    this.description = args.description || null;
}

Deeplink.prototype.shorthandMatches = function(text) {
    return this.shorthand && this.shorthand.test(text);
}

function Match(args) {
    this.text = args.text;	 // the matched text
    this.indices = args.indices; // the matched indices of the text
}
