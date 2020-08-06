/**
 * Within bounds of targetRect aligns element in a mode from the set:
 * ['left', 'right', 'top', 'bottom', 'center']
 */
PACE.AlignElementCommand = function (element, targetRect, mode) {
    'use strict';

    this.execute = function () {
        var center = new PACE.Point(
            targetRect.x + targetRect.width / 2,
            targetRect.y + targetRect.height / 2),
            m = new PACE.Matrix2D();

        if (_.isNumber(element.rotation)) {
            m.rotate(element.rotation * Math.PI / 180);
        }

        m.translate(center.x, center.y);

        var p = m.transformPoint(-element.width / 2, -element.height / 2);

        switch (mode) {
            case 'left':
                element.x = targetRect.x;
                element.y = p.y;
                break;
            case 'right':
                element.x = targetRect.x + targetRect.width - element.width;
                element.y = p.y;
                break;
            case 'top':
                element.x = p.x;
                element.y = targetRect.y;
                break;
            case 'bottom':
                element.x = p.x;
                element.y = targetRect.y + targetRect.height - element.height;
                break;
            case 'center':
            default:
                element.x = p.x;
                element.y = p.y;
                break;
        }

        // element coordinates cannot be smaller than target rectangle
        element.x = Math.max(targetRect.x, element.x);
        element.y = Math.max(targetRect.y, element.y);
    };
};
