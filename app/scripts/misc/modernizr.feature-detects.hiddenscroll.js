/*
 * Detects whether scrollbars on overflowed blocks are hidden (a-la iPhone)
 */
Modernizr.addTest('hiddenscroll', function() {
    return Modernizr.testStyles('#modernizr {width:100px;height:100px;overflow:scroll}', function(elem) {
        return elem.offsetWidth === elem.clientWidth;
    });
});