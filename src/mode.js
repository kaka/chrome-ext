function Mode(args) {
    this.onEnterMode = args.onEnterMode || function() {};
    this.onExitMode = args.onExitMode || function() {};
    this.onInput = args.onInput || function(text, event) {};
    this.onNavigate = args.onNavigate || function(newIndex) {};
    this.onSelect = args.onSelect || function() {};
    this.onAdvance = args.onAdvance || function() { return false; }; // Return whether the mode was advanced or not
    this.onBack = args.onBack || function() {};
}

Mode.prototype.targets = [];
Mode.prototype.filteredTargets = [];
Mode.prototype.selectedTarget = 0;
Mode.prototype.badge = null;
Mode.prototype.text = "";
Mode.prototype.placeholder = "S�k";

Mode.prototype.setInput = function(text, event) {
    console.log("setInput('" + text + "', " + event + ")");
    this.text = text;
    this.onInput(text, event);
};

Mode.prototype.addTargets = function(targets) {
    Array.prototype.push.apply(this.targets, targets);
};

Mode.prototype.getCurrentTarget = function() {
    return this.filteredTargets.length == 0 ? null : this.filteredTargets[this.selectedTarget];
};

Mode.prototype.navigate = function(delta) {
    var n = this.filteredTargets.length;
    this.selectedTarget = n == 0 ? 0 : ((this.selectedTarget + delta + n) % n);
    this.onNavigate(this.selectedTarget);
};

Mode.prototype.filterTargets = function(text) {
    if (text.length) {
	this.filteredTargets = $(this.targets).filter(function(i, e) {
	    e.match = null;
	    var terms = e.searchTerms.split(",");
	    for (var i = 0; i < terms.length; i++) {
		var indices = matches(text, terms[i]);
		if (indices) {
		    if (indices.length > 0)
			e.match = {text:terms[i], indices:indices};
		    return true;
		}
	    }
	    if (e.deeplink && e.deeplink.shorthand) {
		return e.deeplink.shorthand.test(text);
	    }
	    return false;
	    //	return matches(text, e.name) || (e.search != undefined && matches(text, e.search));
	});
    } else {
	this.filteredTargets = Array.from(this.targets);
    }
    console.log("filterTargets('" + text + "') -> " + this.filteredTargets.length);
    return this.filteredTargets;
}

Mode.prototype.getTargets = function() {
    return this.filterTargets(this.text);
};

function isBeginningOfWord(i, s) {
    return i == 0
	|| ((s.charAt(i) == s.charAt(i).toUpperCase()))// && (s.charAt(i-1) == s.charAt(i-1).toLowerCase()))
	|| "_- ([<>])/\\'\"".includes(s.charAt(i-1))
	|| !isNaN(s.charAt(i));
}

function matches(search, text) {
    var s = search.trim().toLowerCase();
    var t = text.trim();
    if (s.length > t.length) return null;
    if (s.length == t.length) return s == t.toLowerCase() ? Array.from(new Array(s.length).keys()) : null;

    function recurse(si, ti, continuous, matchingIndices) {
	if (si == s.length || ti == t.length) {
	    return si == s.length ? matchingIndices : null;
	}
	var matches = false;
	if (s.charAt(si) == t.charAt(ti).toLowerCase() && (continuous ? true : isBeginningOfWord(ti, t))) {
	    matchingIndices.push(ti);
	    matches = recurse(si + 1, ti + 1, true, matchingIndices);
	}
	if (!matches) {
	    matches = recurse(si, ti + 1, false, matchingIndices);
	}
	return matches;
    }

    return recurse(0, 0, false, []);
}