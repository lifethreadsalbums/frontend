angular.module('pace.proofer')
.factory('EditComponent', ['AppConstants', 'SpreadshotService',
    function(AppConstants, SpreadshotService) {

        return React.createClass({

            propTypes: {
                comment: React.PropTypes.object.isRequired,
                selected: React.PropTypes.bool.isRequired,
                header: React.PropTypes.bool.isRequired,
                onArrowClick: React.PropTypes.func.isRequired,
                onItemClick: React.PropTypes.func.isRequired,
                onCompletedClick: React.PropTypes.func.isRequired,
                onDeleteClick: React.PropTypes.func.isRequired,
                user: React.PropTypes.object.isRequired,
                isSpreadBased: React.PropTypes.bool.isRequired
            },

            onDeleteClick: function(e) {
                e.stopPropagation();
                this.props.onDeleteClick(e);
            },

            render: function() {
                var comment = this.props.comment,
                    user = this.props.user,
                    image = comment.element ? comment.element.imageFile : null,
                    itemClass = 'proofer-item active ',
                    statusClass = 'proofer-item__status proofer-item__status--pending',
                    pageNumClass = 'proofer-item__pages proofer-item__pages--' + (this.props.isSpreadBased ? 'spreads' : 'pages'),
                    status = 'Pending';

                if (comment.completed) {
                    statusClass = 'proofer-item__status proofer-item__status--approved';
                    status = 'Completed';
                }

                var date = moment(new Date(comment.dateCreated)).calendar();

                var imageStyle = {};
                if (image) {
                    imageStyle['background-image'] = 'url(' + PACE.StoreConfig.imageUrlPrefix + 'lowres/' + image.url + ')';

                } else {
                    var spreadshot = SpreadshotService.getSpreadshot(comment.layout, comment.spread, comment.element);
                    if (spreadshot) {
                        imageStyle['background-image'] = 'url(' + spreadshot + ')';
                        imageStyle['background-size'] = comment.element ? 'contain' : 'cover';
                    } else {
                        var that = this;
                        SpreadshotService.makeSpreadshot(comment.layout, comment.spread, comment.element).then(function(result) {
                            that.forceUpdate();
                        });
                    }
                }

                var canDelete = comment.user.id===user.id;
                var numReplies = _.reduce(comment.replies, function(num, c) {
                    return num + (c.text && c.text.length>0 && !c.isRead && c.user.id!==user.id ? 1 : 0);
                }, 0);
                if (comment.user.id!==user.id && !comment.isRead) numReplies++;

                //page and image numbers
                var imageNum = 'Spread',
                    pageNumProp = this.props.isSpreadBased ? 'spreadNumber' : 'pageNumber',
                    pageNum = comment.spread ? comment.spread[pageNumProp] : 0;
                if (comment.element) {
                    imageNum = comment.element.imageNumber;
                    pageNum = comment.element[pageNumProp];
                }

                return (
                    React.createElement("div", {className: itemClass}, 
                    	React.createElement("div", {className: "proofer-item__background-image", style: imageStyle}), 

                        React.createElement("div", {className: "proofer-item__inner-wrapper"}, 
                               !this.props.header &&
                                React.createElement("div", {className: "proofer-item__arrow", onClick: this.props.onArrowClick}), 
                            
                            React.createElement("div", {className: "proofer-item__top-bar"}, 
                                
                                    !comment.completed &&
                                    React.createElement("div", {className: "proofer-item__approve-message", onClick: this.props.onCompletedClick}), 
                                
                                
                                    comment.completed &&
                                    React.createElement("div", {className: "proofer-item__unapprove-message", onClick: this.props.onCompletedClick}), 
                                
                                
                                    numReplies>0 &&
                                    React.createElement("div", {className: "proofer-item__replies", onClick: this.props.onArrowClick}, numReplies), 
                                
                                React.createElement("div", {className: statusClass}, status)
                            ), 
                            React.createElement("div", {className: "proofer-item__bottom-bar", onDoubleClick: this.props.onArrowClick, onClick: this.props.onItemClick}, 
                                React.createElement("div", {className: "proofer-item__bottom-bar__footer"}, 
                                    React.createElement("div", {className: pageNumClass}, pageNum), 
                                    React.createElement("div", {className: "proofer-item__images"}, imageNum), 
                                    
                                        canDelete &&
                                        React.createElement("div", {className: "proofer-item__trash", onClick: this.onDeleteClick})
                                    
                                )
                            )
                        )
                    )
                );
            }
        });
    }

]);
