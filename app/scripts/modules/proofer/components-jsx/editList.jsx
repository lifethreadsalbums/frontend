angular.module('pace.proofer')
.factory('EditListComponent', ['EditComponent',
    function(EditComponent) {

        return React.createClass({

            propTypes: {
                spread: React.PropTypes.object.isRequired,
                comments: React.PropTypes.array.isRequired,
                onArrowClick: React.PropTypes.func.isRequired,
                onItemClick: React.PropTypes.func.isRequired,
                onDeleteClick: React.PropTypes.func.isRequired,
                onCompletedClick: React.PropTypes.func.isRequired,
                user: React.PropTypes.object.isRequired,
                isSpreadBased: React.PropTypes.bool.isRequired
            },

            render: function() {
                var comments = this.props.comments;

                 var CSSTransitionGroup = ReactTransitionGroup.CSSTransitionGroup;

                return (
                    <div className="proofer-component__edits">
                        {
                            comments.map(function(comment, i) {
                                return (

                                    <EditComponent
                                        comment={comment}
                                        onArrowClick={this.props.onArrowClick.bind(this, comment)}
                                        onItemClick={this.props.onItemClick.bind(this, comment)}
                                        onDeleteClick={this.props.onDeleteClick.bind(this, comment)}
                                        onCompletedClick={this.props.onCompletedClick.bind(this, comment)}
                                        isSpreadBased={this.props.isSpreadBased}
                                        user={this.props.user} />

                                );
                            }, this)
                        }
                    </div>
                );
            }
        });
    }

]);
