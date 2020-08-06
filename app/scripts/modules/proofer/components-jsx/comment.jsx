angular.module('pace.proofer')
.factory('CommentComponent', ['AppConstants',
    function(AppConstants) {

        return React.createClass({

            propTypes: {
                typing: React.PropTypes.bool,
                prevComment: React.PropTypes.object,
                comment: React.PropTypes.object.isRequired,
                left: React.PropTypes.bool.isRequired
            },

            render: function() {
                var bubbleClass = 'proofer-bubble ' + (this.props.left ? 'proofer-bubble--left green ' : 'proofer-bubble--right blue ');

                if (this.props.typing) {
                    return (
                        <div className={bubbleClass}>
                            <span className="proofer-bubble__dot"></span>
                            <span className="proofer-bubble__dot"></span>
                            <span className="proofer-bubble__dot"></span>
                        </div>
                    );
                }

                var comment = this.props.comment,
                    date = moment(new Date(comment.dateCreated)).format('HH:mm'),
                    messageStatusClass = 'proofer-bubble__checkmark ',
                    showMessageStatus = !this.props.left;

                if (comment.isRead) {
                    messageStatusClass += 'proofer-bubble__checkmark--read';
                } else {
                    messageStatusClass += 'proofer-bubble__checkmark--delivered';
                }

                return (
                    <div className={bubbleClass}>{comment.text}
                        <div className="proofer-bubble__footer">
                            <span className="proofer-bubble__time">{date}</span>
                            {
                                showMessageStatus &&
                                <span className={messageStatusClass}></span>
                            }
                        </div>
                    </div>
                );
            }
        });
    }

]);
