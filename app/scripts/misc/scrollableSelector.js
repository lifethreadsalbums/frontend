;(function() {
    $.extend($.expr[":"], {
        scrollable: function(element) {
            var elementOverflow = elementOverflow;
            var elementOverflowX = $(element).css('overflowX');
            var elementOverflowY = $(element).css('overflowY');
            var vertically_scrollable;
            var horizontally_scrollable;

            if (elementOverflow === 'auto' || elementOverflow === 'scroll' || elementOverflowX === 'scroll' || elementOverflowY === 'scroll') {
                return true;
            }

            vertically_scrollable = (element.clientHeight < element.scrollHeight) && (
                $.inArray(elementOverflowY, ['scroll', 'auto']) !== -1 || $.inArray(elementOverflow, ['scroll', 'auto']) !== -1);

            if (vertically_scrollable) {
                return true;
            }

            horizontally_scrollable = (element.clientWidth < element.scrollWidth) && (
                $.inArray(elementOverflowX, ['scroll', 'auto']) !== -1 || $.inArray(elementOverflow, ['scroll', 'auto']) !== -1);
            
            return horizontally_scrollable;
        }
    });
})();
