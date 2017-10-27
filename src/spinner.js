var Spinner = {
    counter: 0
};

Spinner.init = function(element, onClick) {
    Spinner.element = element;
    element.click(function(event) {
	if (Spinner.element.hasClass("clickable")) {
	    onClick();
	}
    });
}

Spinner.pushTask = function() {
    if (++this.counter == 1) {
	this.element.addClass("rotation");
	this.element.removeClass("clickable");
    }
}

Spinner.popTask = function() {
    if (--this.counter <= 0) {
	this.counter = 0;
	this.element.removeClass("rotation");
	this.element.addClass("clickable");
    }
}
