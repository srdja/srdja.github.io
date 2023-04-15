
function themeSet() { // rename to themeLoad()
    var theme = "theme-dark";
    if (localStorage.getItem('theme-name') === null) {
        localStorage['theme-name'] = theme;
    } else {
        theme = localStorage['theme-name'];
    }
    document.documentElement.className = theme;
}


function themeGetColor(element) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(element);
}


function themeSetToggle() {
    var theme = localStorage['theme-name'];
    document.getElementById('theme-toggle').innerHTML
        = (theme === "theme-dark" ? "light" : "dark");
}


function themeName() {
    return localStorage.getItem('theme-name');
}


var themeChangeCB = [];


function onThemeChange(cb) {
    themeChangeCB.push(cb);
}


function themeToggle() {
    var button = document.getElementById('theme-toggle');
    button.addEventListener('click', function(event) {
        var theme = localStorage['theme-name'];

        localStorage['theme-name'] =
            theme === "theme-dark" ? "theme-light" : "theme-dark";

        button.innerHTML = theme === "theme-dark" ? "dark" : "light";

        themeSet();
        themeChangeCB.map(cb => cb());
    });
}
