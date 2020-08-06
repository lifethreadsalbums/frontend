'use strict';

angular.module('paceApp')
	.directive('collapseSidebar', function () {
		return {
			restrict: 'A',
			link: function postLink(scope, element, attrs) {
				var targetFolded = $(element.data('target-folded')),
					targetPosition = $(element.data('target-position')),
					$window = $(window),
                    isFolded = targetFolded.hasClass('folded');

                toggleTitle();

				element.on('click', function() {
                    isFolded = !isFolded;
                    toggleTitle();
					targetFolded.toggleClass('folded');
                    targetPosition.toggleClass('folded');
					$window.trigger('resize');
					PACE.utils.setIntervalN(function() {
						$window.trigger('resize');
					}, 10, 35);
				});

				element.on('$destroy', function() {
					element.unbind('click');
				});

                function toggleTitle() {
                    var items = targetFolded.find('[data-title]');

                    _.map(items, function(item) {
                        item = $(item);

                        if (isFolded) {
                            item.attr('title', item.data('title'));
                        } else {
                            item.removeAttr('title');
                        }
                    });
                }
			}
		};
	});
