(function() {
    'use strict';

    /**
    * React component that represents an single filmstrip image item
    * @constructor
    */
    var FilmstripItemComponentClass = function(StoreConfig, $rootScope, ngDialog, UploadEvent, ImageFileStatus) {

        return React.createClass({

            propTypes: {
                id: React.PropTypes.string.isRequired,
                itemIndex: React.PropTypes.number.isRequired,
                filmstrip: React.PropTypes.object.isRequired,
                image: React.PropTypes.object.isRequired,
                firstNonCoverItem: React.PropTypes.bool.isRequired,
                isDoubleSpread: React.PropTypes.bool.isRequired,
                selected: React.PropTypes.bool.isRequired,
                hovered: React.PropTypes.bool.isRequired,
                starred: React.PropTypes.bool.isRequired,
                onMouseDown: React.PropTypes.func.isRequired,
                onMouseOver: React.PropTypes.func.isRequired,
                onMouseOut: React.PropTypes.func.isRequired,
                onMouseUp: React.PropTypes.func.isRequired,
                onDoubleClick: React.PropTypes.func.isRequired,
                onDragStart: React.PropTypes.func.isRequired,
                onDragEnd: React.PropTypes.func.isRequired,
                onDragOver: React.PropTypes.func.isRequired,
                onStarClick: React.PropTypes.func.isRequired,
                onFileInfoClick: React.PropTypes.func.isRequired,
                onHoverOver: React.PropTypes.func.isRequired,
                onHoverOut: React.PropTypes.func.isRequired,
                showInfo: React.PropTypes.bool.isRequired,
                showAdminInfo: React.PropTypes.bool.isRequired,
                showPageNumbers: React.PropTypes.bool.isRequired,
                isSpreadBased: React.PropTypes.bool.isRequired,
                disableDimmingThumbnails: React.PropTypes.bool.isRequired,
                stackId: React.PropTypes.string,
                stackItemNumber: React.PropTypes.number,
                stackItemCount: React.PropTypes.number,
                stackCollapsed: React.PropTypes.bool,
                occurrences: React.PropTypes.array,
                thumbScale: React.PropTypes.number,
            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },
            
            getInitialState: function () {
                return { thumbSrc: null, uploadProgress:null };
            },
            
            componentWillMount: function () {
                this.updateThumbSrc(this, this.props.image);
            },
            
            componentWillReceiveProps: function (nextProps) {
                this.updateThumbSrc(this, nextProps.image);
            },

            componentDidMount: function () {
                var element = $(this.getDOMNode());
                element.hoverIntent( {
                    over: this.onHoverOver,
                    out: this.onHoverOut,
                    interval: 250
                });
            },

            componentWillUnmount: function () {
                var element = $(this.getDOMNode());
                element.off('mouseenter.hoverIntent mouseleave.hoverIntent');
            },

            updateThumbSrc: function(that, imageFile) {
                if (!imageFile)
                    return;

                if (imageFile.thumbnailAsBase64) {
                    this.setState({
                        thumbSrc: imageFile.thumbnailAsBase64
                    });
                } else if (imageFile.url) {
                    this.setState({
                        thumbSrc: StoreConfig.imageUrlPrefix + 'thumbnail/' + imageFile.url
                    });
                }
                if (imageFile.promise && imageFile.promise.then) {
                    imageFile.promise.then(
                        function(value) { },
                        function(error) {
                            if (!that.isMounted()) return;
                            that.setState({ uploadProgress:null });
                        },
                        function(event) {
                            if (!that.isMounted()) return;

                            switch (event.type) {
                                case UploadEvent.ThumbnailReady:
                                    that.setState({ thumbSrc: imageFile.thumbnailAsBase64 });
                                    break;
                                case UploadEvent.UploadStart:
                                    that.setState({ uploadProgress:0 });
                                    break;
                                case UploadEvent.UploadProgress:
                                    if(imageFile.progress < 100) {
                                        that.setState({ uploadProgress:imageFile.progress });
                                    } else {
                                        that.setState({ uploadProgress:null });
                                    }
                                    break;
                            }
                        }
                    );
                }
            },

            onStarClick: function(e) {
                this.props.onStarClick(e);
            },

            onFileInfoClick: function(e) {
                this.props.onFileInfoClick(e);
            },

            onMouseDown: function(e) {
                this.props.onMouseDown(e);
            },

            onDoubleClick: function(e) {
                this.props.onDoubleClick(e);
            },

            onMouseUp: function(e) {
                this.props.onMouseUp(e);
            },

            onMouseOver: function(e) {
                this.props.onMouseOver(e);
            },

            onMouseOut: function(e) {
                this.props.onMouseOut(e);
            },

            onDragStart: function(e) {
                this.props.onDragStart(e);
            },

            onDragEnd: function(e) {
                this.props.onDragEnd(e);
            },

            onDragOver: function(e) {
                var dt = e.dataTransfer;
                //if (dt.types.indexOf('text/x-pace-filmstrip-items') === -1)
                //    return;

                if (!PACE.utils.containsDragType(dt.types,'text/x-pace-filmstrip-items'))
                    return;

                if (this.props.stackCollapsed && this.props.stackItemNumber>1)
                    return;

                dt.dropEffect = 'move';

                var el = this.getDOMNode(),
                    rect = el.getBoundingClientRect(),
                    mid = rect.left + rect.width/2,
                    dropClass = 'drop-' + (e.pageX < mid ? 'left' : 'right'),
                    dropIndex = this.props.itemIndex + (dropClass === 'drop-right' ? 1 : 0);

                this.setState({dropClass:dropClass});
                this.props.onDragOver(dropIndex, e);
            },

            onDragLeave: function(e) {
                this.setState({dropClass:null});
                this.forceUpdate();
            },

            onHoverOver: function(e) {
                this.props.onHoverOver(e);
            },

            onHoverOut: function(e) {
                this.props.onHoverOut(e);
            },

            render: function() {
                var occurrences = this.props.occurrences || [];

                var cx = classNames,
                    filmstripItemClasses = {
                        'filmstrip-item': true,
                        'active': this.props.selected,
                        'rejected': this.props.image.status===ImageFileStatus.Rejected,
                        'hover': this.props.hovered,
                        'double-spread': this.props.isDoubleSpread,
                        'filmstrip-stack': true,
                        'uploading': this.state.uploadProgress!==null,
                        'stack': !!(this.props.stackId),
                        'stack-first': this.props.stackId && this.props.stackItemNumber === 1,
                        'stack-last': this.props.stackId && this.props.stackItemNumber === this.props.stackItemCount,
                        'stack-first-collapsed': this.props.stackItemNumber === 1 && this.props.stackCollapsed,
                        'used': occurrences.length > 0 && !this.props.disableDimmingThumbnails,
                        'hidden-stack-item': this.props.stackCollapsed && this.props.stackItemNumber > 1
                    },
                    uploadMeterStyle = {
                        width: (this.state.uploadProgress || 0) +'%',
                    };

                if (this.state.dropClass)
                    filmstripItemClasses[this.state.dropClass] = true;
                if (this.props.stackId) {
                    filmstripItemClasses['stack-'+this.props.stackItemCount] = true;
                }

                var classes = cx(filmstripItemClasses);

                var showStackHandle = (this.props.stackId &&
                    this.props.stackItemNumber === this.props.stackItemCount) ||
                    (this.props.stackItemNumber === 1 && this.props.stackCollapsed);

                var hasErrors = this.props.image.status===ImageFileStatus.Rejected;

                var liStyles = {},
                    previewStyles = {};
                if (this.props.thumbScale) {
                    //original size from css
                    //height: 114px;
                    //width: 150px;
                    liStyles.width = Math.round(150 * this.props.thumbScale) + 'px';
                    liStyles.height = Math.round(114 * this.props.thumbScale) + 'px';

                    //height: 85px
                    previewStyles.height = (Math.round(114 * this.props.thumbScale) - (114 - 85)) + 'px';
                }
                if (this.props.firstNonCoverItem) {
                    var scale = this.props.thumbScale || 1;
                    liStyles.marginLeft = Math.round(150 * scale) + 'px';
                }

                var iccProfile = this.props.image.targetIccProfile ? this.props.image.targetIccProfile.label : '',
                    iccProfileStyle = { };
                if (this.props.image.customIccProfile) {
                    iccProfile = this.props.image.customIccProfile.label;
                }
                if (iccProfile && iccProfile.indexOf("BW")==0)
                    iccProfileStyle.color = '#fff';
                else
                    iccProfileStyle.color = '#00ffff';

                var pageNum, imageNum,
                    pageNumClass = 'page-number page-number--pages';
               
                if (occurrences.length>0) {
                    var el = occurrences[0].element,
                        pageNumProp = this.props.isSpreadBased ? 'spreadNumber' : 'pageNumber';
                    
                    imageNum = el.imageNumber;
                    pageNum = el[pageNumProp];
                }


                return (

                    React.createElement("li", {id: this.props.id, style: liStyles, className: classes, draggable: "true", 
                        onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, 
                        onDoubleClick: this.onDoubleClick, onMouseOver: this.onMouseOver, 
                        onMouseOut: this.onMouseOut, 
                        onDragStart: this.onDragStart, onDragEnd: this.onDragEnd, 
                        onDragOver: this.onDragOver, onDragLeave: this.onDragLeave, 
                        onDrop: this.onDragLeave}, 
                        React.createElement("div", {className: "filmstrip-item-inner"}, 

                            
                                this.props.showAdminInfo ? React.createElement("span", {style: iccProfileStyle, className: "admin-info"}, iccProfile) : null, 
                            

                            React.createElement("div", {className: "preview", style: previewStyles}, 
                                React.createElement("img", {draggable: "false", src: this.state.thumbSrc}), 
                                React.createElement("span", {className: "stack-info clearfix"}, 
                                     this.props.stackId ?
                                        React.createElement("span", {className: "stack-order"}, 
                                            this.props.stackItemNumber, " / ", this.props.stackItemCount
                                        ) : null, 
                                     occurrences.length > 1 ?
                                        React.createElement("span", {className: "stack-duplicate"}, occurrences.length) : null
                                ), 

                                
                                //     this.state.uploadProgress!==null ?
                                //         <span className="uploading-text">Uploading...</span> : null
                                

                                
                                    this.state.uploadProgress!==null ?
                                        React.createElement("span", {className: "upload-progress"}, 
                                            React.createElement("div", {className: "progress cancel"}, 
                                                React.createElement("span", {className: "meter", style: uploadMeterStyle})
                                            )
                                        ) : null, 
                                
                                React.createElement("div", {className: "options-bar"}, 
                                     
                                        !this.props.starred &&
                                        React.createElement("span", {className: "favorite-star", onClick: this.onStarClick}), 
                                    
                                    
                                        occurrences.length > 0 && this.props.showPageNumbers &&
                                        React.createElement("div", {className: pageNumClass}, pageNum), 
                                    
                                    
                                        occurrences.length > 0 && this.props.showPageNumbers &&
                                        React.createElement("div", {className: "image-number"}, imageNum), 
                                    
                                    React.createElement("span", {title: "Large Preview (spacebar)", className: "details", onMouseDown: this.onFileInfoClick})
                                ), 
                                
                                    hasErrors ?
                                        React.createElement("object", {className: "img-error", type: "image/svg+xml", data: "/images/no-access.svg"}) : null, 
                                

                                
                                    this.props.starred ?
                                        React.createElement("span", {className: "favorite-active", onClick: this.onStarClick}) : null
                                
                            ), 

                             this.props.showInfo ? React.createElement("span", {className: "filename"}, this.props.image.filename) : null, 

                            
                                (this.props.stackItemNumber === 1 && this.props.stackCollapsed) ?
                                    React.createElement("span", {className: "stack-preview"}, 
                                        React.createElement("div", {className: "rotator"}, 
                                            React.createElement("span", {className: "item img-container"}, 
                                                React.createElement("img", {src: this.state.thumbSrc}), 
                                                React.createElement("span", {className: "stack-info clearfix"}, 
                                                    React.createElement("span", {className: "stack-order"}, this.props.stackItemCount)
                                                )
                                            ), 
                                            React.createElement("div", {className: "shadow-page-1"}), 
                                            React.createElement("div", {className: "shadow-page-2"})
                                        )
                                    ) : null, 
                            

                            
                                showStackHandle ?
                                    React.createElement("span", {className: "stack-handle"}, 
                                        React.createElement("span", {className: "stack-handle-arrow"})
                                    ) : null
                            

                        )
                    )

                );
            }
        });
    };

    angular.module('pace.layout').provider('FilmstripItemComponent', function() {
        this.$get = ['StoreConfig', '$rootScope', 'ngDialog', 'UploadEvent', 'ImageFileStatus', FilmstripItemComponentClass ];
    });

})();
