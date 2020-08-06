'use strict';

var originalFindTargetCorner = fabric.Object.prototype._findTargetCorner;

fabric.util.object.extend(fabric.Object.prototype, {

        /**
            Returns the object's transformation matrix
        */
        getMatrix: function() {
            var m = new PACE.Matrix2D();
            var origin = {x:0, y:0};
            if (this.originX==='center')
                origin.x = this.width/2;
            else if (this.originX==='right')
                origin.x = this.width;
            
            if (this.originY==='center')
                origin.y = this.height/2;
            else if (this.originY==='bottom')
                origin.y = this.height;

            m.translate(-origin.x, -origin.y);
            m.rotate(this.angle*Math.PI/180);
            m.scale(this.scaleX, this.scaleY);
            m.translate(this.left, this.top);
            
            return m;
        },

        /**
            Returns a global transformation matrix, 
            which is the object's matrix + the group's matrix, if it's a part of the group
        */
        getGlobalMatrix: function() {
            var matrix = this.getMatrix();

            if (this.group) {
                var group = this.group;

                var gm = new PACE.Matrix2D();
                gm.translate(group.width/2, group.height/2);
                gm.rotate(group.angle*Math.PI/180);
                gm.scale(group.scaleX, group.scaleY);
                gm.translate(group.left, group.top);

                matrix.prependMatrix(gm);
            }
            return matrix;
        },

        /**
            convert object coordinates from fabric space to the model space
        */
        getCoordsInModelSpace : function() {
            
            var group = this.group,
                m = this.getGlobalMatrix(),
                pt;

            var canvas = this.canvas;
            if (this.type==='group' && this.objects.length>0) {
                canvas = this.objects[0].canvas;
            } 
            var offset = canvas.offset,
                scale = canvas.scale;
            
            if (group) {
                var scaleX = this.canvas.scale / group.scaleX,
                    scaleY = this.canvas.scale / group.scaleY;

                pt = m.transformPoint(0,0);
                return {
                    x: (pt.x / this.canvas.scale) - offset.x, 
                    y: (pt.y / this.canvas.scale) - offset.y,
                    width: this.width / scaleX * this.scaleX,
                    height: this.height / scaleY * this.scaleY,
                    rotation: this.angle,
                };
            } else {
                pt = m.transformPoint(0,0);
                return {
                    x: (pt.x / scale) - offset.x, 
                    y: (pt.y / scale) - offset.y,
                    width: this.width / scale * this.scaleX,
                    height: this.height / scale * this.scaleY,
                    rotation: this.angle,
                };
            }
            
        },
    
        getCoordsInModelNotCentered: function () {
            var group = this.group,
                m = this.getMatrix(),
                pt = m.transformPoint(0, 0),
                off = this.canvas.offset,
                scaleX = this.canvas.scale,
                scaleY = this.canvas.scale;

            if (group) {
                scaleX = this.canvas.scale / group.scaleX;
                scaleY = this.canvas.scale / group.scaleY;
            }

            return {
                x: (pt.x / scaleX) - off.x,
                y: (pt.y / scaleY) - off.y,
                width: this.width / scaleX * this.scaleX,
                height: this.height / scaleY * this.scaleY,
                rotation: this.angle
            };
        },

        setCoordsFromModelNotCentered: function (coords) {
            var group = this.group,

                off = this.canvas.offset,
                scaleX = this.canvas.scale,
                scaleY = this.canvas.scale;

            if (group) {
                scaleX = this.canvas.scale / group.scaleX;
                scaleY = this.canvas.scale / group.scaleY;
            }

            this.left = (coords.x + off.x) * scaleX;
            this.top = (coords.y + off.y) * scaleY;
            this.width = coords.width * scaleX / this.scaleX;
            this.height = coords.height * scaleY / this.scaleY;
            
            this.setCoords();
        },

        _setPositionFromModel: function(element) {
            var group = this.group,
                scale = group ? 1.0 : this.canvas.scale,
                offset = this.canvas.offset;

            var m = new PACE.Matrix2D();
            m.rotate( (element.rotation || 0) * Math.PI/180);
            m.translate(element.x, element.y);

            var left = 0,
                top = 0,
                offsetX = group ? 0 : offset.x,
                offsetY = group ? 0 : offset.y;

            if (this.originX==='center')
                left = element.width/2;
            else if (this.originX==='right')
                left = element.width;

            if (this.originY==='center')
                top = element.height/2;
            else if (this.originY==='bottom')
                top = element.height;
            if (group)
                m.translate(-group.width/2, -group.height/2);

            var pt =  m.transformPoint(left, top);
            this.left = (pt.x + offsetX) * scale;
            this.top = (pt.y + offsetY) * scale;
        },

        setPositionFromModel: function(element) {
            this._setPositionFromModel(element);
            this.setCoords();
        },

        setCoordsFromModel: function(element) {
            var scale = this.group ? 1.0 : this.canvas.scale;
            
            this._setPositionFromModel(element);

            this.width = element.width;
            this.height = element.height;
            this.scaleX = scale;
            this.scaleY = scale;
            this.angle = element.rotation || 0;
            this.opacity = typeof(element.opacity) === 'undefined' ? 1.0 : element.opacity;
            this.setCoords();
        },

        _findTargetCorner: function(pointer) {
            
            if (this.forceCorner) {
                return this.forceCorner;
            }
            return originalFindTargetCorner.call(this, pointer);
            
        },

        _getRoundedBounds: function() {
            if (this.type==='group' && this.angle===0) {
                var points = [],
                    n = this.objects.length,
                    minx = Number.MAX_VALUE, miny = Number.MAX_VALUE,
                    maxx = Number.MIN_VALUE, maxy = Number.MIN_VALUE;

                for (var i = 0;i < n; i++) {
                    var o = this.objects[i],
                        m = o.getGlobalMatrix();
                    points.push(m.transformPoint(0, 0));
                    points.push(m.transformPoint(o.width, 0));
                    points.push(m.transformPoint(o.width, o.height));
                    points.push(m.transformPoint(0, o.height));
                }
                n = points.length;
                for (var i = 0;i < n; i++) {
                    var p = points[i];
                    p.x = Math.round(p.x);
                    p.y = Math.round(p.y);
                    if (p.x<minx) minx = p.x;
                    if (p.y<miny) miny = p.y;
                    if (p.x>maxx) maxx = p.x;
                    if (p.y>maxy) maxy = p.y;
                }

                return {
                    x: minx,
                    y: miny,
                    width: maxx - minx, 
                    height: maxy - miny
                };

            } else {
                var matrix = this.getGlobalMatrix(),
                    lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
                    rt = new PACE.Point(matrix.transformPoint(this.width, 0)).round(),
                    lb = new PACE.Point(matrix.transformPoint(0, this.height)).round(),
                    width = PACE.Point.distance(lt, rt),
                    height = PACE.Point.distance(lt, lb);

                return {
                    x: lt.x,
                    y: lt.y,
                    width: width, 
                    height: height
                };
            }
        },

        //override the drawBorders method to make the borders crisp
        drawBorders: function(ctx) {
            if (!this.hasBorders) {
                return this;
            }

            ctx.save();

            var bounds = this._getRoundedBounds();

            ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = (this.lockMovementX && this.lockMovementY) ? 3 : 1;

            ctx.setTransform(1,0,0,1,0,0);
            ctx.translate(bounds.x, bounds.y);
            ctx.rotate(this.angle * Math.PI/180);
            ctx.strokeRect(0.5, 0.5, bounds.width, bounds.height);
           
            ctx.restore();

            return this;
        },

        //override drawControls method to make the anchors look super crisp
        drawControls: function(ctx) {
            
            if (!this.hasControls) {
                return this;
            }

            var scaleOffset = Math.ceil(this.cornerSize / 2),
                methodName = this.transparentCorners ? 'strokeRect' : 'fillRect';

            var bounds = this._getRoundedBounds(),
                width = bounds.width,
                height = bounds.height,
                left = (-scaleOffset),
                top = (-scaleOffset);

            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);

            ctx.translate(bounds.x, bounds.y);
            ctx.rotate(this.angle * Math.PI/180);
            
            ctx.lineWidth = 1;

            ctx.globalAlpha = 1;// this.isMoving ? this.borderOpacityWhenMoving : 1;
            ctx.strokeStyle = ctx.fillStyle = this.cornerColor;

            // top-left
            this._drawControl('tl', ctx, methodName, 
                left,
                top);

            // top-right
            this._drawControl('tr', ctx, methodName,
                left + width,
                top);

            // bottom-left
            this._drawControl('bl', ctx, methodName,
                left,
                top + height);

            // bottom-right
            this._drawControl('br', ctx, methodName,
                left + width,
                top + height);

            //if (!this.get('lockUniScaling')) {

                //if (this.type==='group') {
                    ctx.strokeStyle = ctx.fillStyle = '#01db25';
                //}

                // middle-top
                this._drawControl('mt', ctx, methodName,
                    Math.round(left + width/2),
                    top);

                // middle-bottom
                this._drawControl('mb', ctx, methodName,
                    Math.round(left + width/2),
                    top + height);

                // middle-right
                this._drawControl('mr', ctx, methodName,
                    left + width,
                    Math.round(top + height/2));

                // middle-left
                this._drawControl('ml', ctx, methodName,
                    left,
                    Math.round(top + height/2));
            //}
            ctx.restore();
            return this;
        },

    }
);
