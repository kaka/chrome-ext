document.addEventListener('DOMContentLoaded', function() {
    // Build a table of contents
    $("#main").find("h2, h3, h4").each(function(i, e) {
	e.id = e.id || ("h" + i);
	let li = $("<li>")
	    .addClass("toc-" + e.nodeName.toLowerCase())
	    .append(
		$("<a>")
		    .text(e.innerText)
		    .prop("href", "#" + e.id)
	    );
	// Show warnings
	if (e.getAttribute("class") == "warning") {
	    li.append(" ").append($("<span>!</span>").addClass("badge badge-warning"));
	}
	// Show dangers
	if (e.getAttribute("class") == "danger") {
	    li.append(" ").append($("<span>!</span>").addClass("badge badge-danger"));
	}
	// Show what's new
	if (e.getAttribute("data-version") == chrome.runtime.getManifest().version) {
	    li.append(" ").append($("<span>Nytt</span>").addClass("badge badge-info"));
	}
	$("#toc").append(li);
    });
});
