'use strict';

angular.module('paceApp')
    .service('PaceTooltipService', ['$timeout', '$window', function PaceTooltipService($timeout, $window) {
        var tooltipEl;
        var tooltipRemoveTimeout;

        this.start = function(el) {
            $(el).on('mouseenter', '[data-pace-tooltip]', showTooltip);
            $(el).on('mouseleave mousedown', '[data-pace-tooltip]', hideTooltip);
        };

        this.stop = function(el) {
            $(el).off('mouseenter', '[data-pace-tooltip]', showTooltip);
            $(el).off('mouseleave mousedown', '[data-pace-tooltip]', hideTooltip);
        };

        function showTooltip(e) {
            var sourceEl = $(e.currentTarget);
            var tooltipText = sourceEl[0].dataset.paceTooltip;
            var tooltipPosition = sourceEl.data('paceTooltipPosition') || 'bottom';

            $timeout.cancel(tooltipRemoveTimeout);

            tooltipEl && tooltipEl.remove();
            tooltipEl = $('<div class="pace-tooltip pace-tooltip--' + tooltipPosition + '">' + tooltipText + '<span class="pace-tooltip__arrow pace-tooltip__arrow--' + tooltipPosition + '"></span></div>');
            $('body').append(tooltipEl);
            calculatePosition(sourceEl, tooltipPosition);
            tooltipEl.addClass('pace-tooltip--in');
        }

        function hideTooltip() {
            if (tooltipEl) {
                tooltipEl.removeClass('pace-tooltip--in');
                tooltipRemoveTimeout = $timeout(function() {
                    tooltipEl.remove();
                }, 300);
            }
        }

        function calculatePosition(sourceEl, tooltipPosition) {
            var offset = sourceEl.offset();

            if (tooltipPosition === 'bottom') {
                tooltipEl.css({
                    top: offset.top + sourceEl.outerHeight() + 12,
                    right: 'auto',
                    bottom: 'auto',
                    left: offset.left
                });
            } else if (tooltipPosition === 'top') {
                tooltipEl.css({
                    top: 'auto',
                    right: 'auto',
                    bottom: $window.innerHeight - offset.top + 12,
                    left: offset.left
                });
            } else if (tooltipPosition === 'left') {
                tooltipEl.css({
                    top: offset.top,
                    right: 'auto',
                    bottom: 'auto',
                    left: offset.left - tooltipEl.outerWidth() - 12
                });
            } else if (tooltipPosition === 'right') {
                tooltipEl.css({
                    top: offset.top,
                    right: 'auto',
                    bottom: 'auto',
                    left: offset.left + sourceEl.outerWidth() + 12
                });
            }
        }
    }]);
