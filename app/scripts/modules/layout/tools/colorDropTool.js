PACE.ColorDropTool = function(layoutController) {
	"use strict";

	this.init(layoutController);

    this.onDrop = function(renderer, e) {
        var color = e.dataTransfer.getData("text/x-pace-color");
        console.log('ColorDropTool', color, this.dropMode);
        if (this.dropTarget) {
            var el = this.dropTarget.element,
                cmd = new PACE.TransformElementCommand(el, {backgroundColor:color});
            layoutController.execCommand(cmd);
        } else {
            if (this.dropMode==='spread-spread') {
                var cmd = new PACE.ChangeSpreadBackgroundColor(renderer.spreadInfo, color);
                layoutController.execCommand(cmd);
            } else if (this.dropMode==='spread-left' || this.dropMode==='spread-right') {

                var leftPage = this.dropMode==='spread-left',
                    page = _.find(renderer.spreadInfo.pages, 
                        function(page) { 
                            return leftPage ? page.isLeft() : page.isRight();
                        }
                    );
                var cmd = new PACE.ChangePageBackgroundColor(page, color);
                layoutController.execCommand(cmd);
            }
        }
    };
	
};

PACE.ColorDropTool.prototype = new PACE.BaseDropTool();