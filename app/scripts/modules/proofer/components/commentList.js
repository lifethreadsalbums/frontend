angular.module('pace.proofer')
.factory('CommentListComponent', ['CommentComponent', 'EditComponent',
    function(CommentComponent, EditComponent) {

        return React.createClass({

            propTypes: {
                comments: React.PropTypes.array.isRequired,
                user: React.PropTypes.object.isRequired,
                typing: React.PropTypes.bool
            },

            render: function() {
                var comments = this.props.comments;

                return (
                    React.createElement("div", {className: "messages-content"}, 
                        
                            comments.map(function (comment, i) {
                                if (!comment.text || comment.text.length === 0) return;

                                var left = comment.user.id !== this.props.user.id;
                                var currentCommentDate = moment(new Date(comment.dateCreated));
                                var prevComment = comments[i - 1];
                                var blockDate;
                                var prevCommentDate;

                                if (prevComment) {
                                    prevCommentDate = moment(new Date(prevComment.dateCreated));
                                }

                                if (!prevComment || currentCommentDate.diff(prevCommentDate, 'days') > 0) {
                                    blockDate = moment(new Date(comment.dateCreated)).calendar(null, {
                                        sameDay: '[Today]',
                                        nextDay: '[Tomorrow]',
                                        nextWeek: 'dddd',
                                        lastDay: '[Yesterday]',
                                        lastWeek: '[Last] dddd',
                                        sameElse: 'ddd, MMM D'
                                    });

                                    return (
                                        React.createElement("div", {className: "clearfix clear-both"}, 
                                            React.createElement("div", {className: "proofer-bubble__date-container"}, 
                                                React.createElement("span", {className: "proofer-bubble__date"}, blockDate)
                                            ), 
                                            React.createElement(CommentComponent, {
                                                comment: comment, 
                                                prevComment: prevComment, 
                                                left: left})
                                        )
                                    );
                                }

                                return (
                                    React.createElement(CommentComponent, {
                                        comment: comment, 
                                        prevComment: prevComment, 
                                        left: left})
                                );
                            }, this), 
                        

                        
                            this.props.typing &&
                            React.createElement(CommentComponent, {
                                typing: true, 
                                left: true})
                        
                        
                    )
                );
            }
        });
    }

]);
