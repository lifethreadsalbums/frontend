'use strict';

angular.module('paceApp')
.directive('textadvanced', ['TermService', function (TermService) {
    return {
        templateUrl: 'views/components/textAdvanced.html',
        replace: true,
        restrict: 'E',
        require: 'form',
        link: function postLink(scope, element, attrs, ctrl) {
            var textarea = element.find('textarea'),
                label = attrs.label,
                rows = attrs.rows,
                cols = attrs.cols,
                alignment = attrs.alignment,
                addline = attrs.addline;

            // Set label
            if (label != "")
                $('.textadvanced-text').text(label);
            else
                $('.textadvanced-text').hide();

            // Set number of rows
            if (!(parseInt(rows) > 0))
                rows = 1;
            textarea.attr('rows', rows);

            // Set number of columns
            if (!(parseInt(cols) > 0))
                cols = 50;
            textarea.attr('cols', cols);

            // Set alignment
            if (alignment !== "true")
                $('.textadvanced-alignment').hide();

            // Set add line
            if (addline !== "true")
                $('.textadvanced-addline').hide();

            // Limit numbers of rows user can write, ignores paste method
            textarea.on('keydown', function(e) {
                var lines = textarea.val().split(/\r*\n/).length,
                    rows = textarea.attr('rows');

                if (lines >= rows && e.keyCode == 13)
                    return false;
            });

            $('.textadvanced-alignment span').on('click', function() {
                var alignType = 'left';

                if ($(this).hasClass('justify-center'))
                    alignType = 'center';
                else if ($(this).hasClass('justify-right'))
                    alignType = 'right';

                textarea.css('text-align', alignType);
            });

            // Add new line
            $('.textadvanced-addline').on('click', function() {
                textarea.attr('rows',  parseInt(textarea.attr('rows')) + 1);
            });
        }
    };
}]);
