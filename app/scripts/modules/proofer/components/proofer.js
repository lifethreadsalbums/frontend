angular.module('pace.proofer')
.factory('ProoferComponent', ['EditListComponent', 'CommentListComponent', 'ProoferService', 'EditComponent', 'AngularDropdownComponent', 'MessageService',
    function(EditListComponent, CommentListComponent, ProoferService, EditComponent, AngularDropdownComponent, MessageService) {

        return React.createClass({

            propTypes: {
                layoutController: React.PropTypes.object.isRequired,
                layout: React.PropTypes.object.isRequired,
                prooferSettings: React.PropTypes.object.isRequired,
                currentSpread: React.PropTypes.object.isRequired,
                user: React.PropTypes.object.isRequired,
                isSpreadBased: React.PropTypes.bool.isRequired,
                onSelectedEditChanged: React.PropTypes.func.isRequired,
                onEditClick: React.PropTypes.func.isRequired,
                onApproveClick: React.PropTypes.func.isRequired,
                onFilterChanged: React.PropTypes.func.isRequired,
                brideMode: React.PropTypes.bool.isRequired
            },

            getInitialState: function () {
                return {  selectedEdit: null, commentText:'', filter:'pending' };
            },

            componentWillMount: function () {

            },

            componentDidMount: function () {
                ProoferService.onChange(this.onCommentsChange.bind(this));
                if (this.props.layout) {
                    ProoferService.init(this.props.layout);
                    this.loadingComments = true;
                }
                if (this.props.layoutController) {
                    this.listeners = [
                        this.props.layoutController.scope.$on('proofer:comment-created', this.onCommentCreated),
                        this.props.layoutController.scope.$on('proofer:comment-typing', this.onCommentTyping),
                        this.props.layoutController.scope.$on('proofer:next-edit-clicked', this.onNextEditClicked),
                        this.props.layoutController.scope.$on('proofer:prev-edit-clicked', this.onPrevEditClicked),
                        this.props.layoutController.scope.$on('proofer:filter-clicked', this.onFilterClicked),
                        this.props.layoutController.scope.$on('layout:find-image-in-filmstrip', this.onFindImage),
                        this.props.layoutController.scope.$on('layout:images-dropped', this.onLayoutChanged),
                        this.props.layoutController.scope.$on('layout:elements-deleted', this.onLayoutChanged),
                        this.props.layoutController.scope.$on('proofer:unread-badge-clicked', this.onUnreadBadgeClicked)
                    ];
                }
            },

            componentWillUnmount: function () {
                _.each(this.listeners, function(listener) { listener(); });
                this.listeners = null;
            },

            componentWillReceiveProps: function (nextProps) {
                var prevLayout = this.props.layout || {},
                    nextLayout = nextProps.layout || {};
                if (nextLayout.id !== prevLayout.id) {
                    ProoferService.init(nextProps.layout);
                }
                if (this.props.brideMode && nextProps.currentSpread && nextProps.currentSpread!==this.props.currentSpread &&
                    this.state.selectedEdit && this.state.selectedEdit.spreadId!==nextProps.currentSpread._id) {
                    this.setSelectedEdit(null);
                }
            },

            setSelectedEdit: function(selectedEdit, fireEvent) {
                if (selectedEdit!==this.state.selectedEdit) {
                    var edit = this.state.selectedEdit;
                    this.setState({selectedEdit: selectedEdit, lastSelectedEdit:this.state.selectedEdit});

                    //mark as archived
                    if (this.props.brideMode && edit && edit.completed && !edit.isArchived) {
                        edit.isArchived = true;
                        ProoferService.saveComment(edit);

                        if (this.state.filter==='completed' && ProoferService.getNumCompleted()===1) {
                            setTimeout(this.archiveLastCompletedEdit.bind(this, selectedEdit), 5000);
                        }
                    }

                    ProoferService.setSelectedEdit(selectedEdit);
                    
                    if (fireEvent) {
                        if (this.props.onSelectedEditChanged) this.props.onSelectedEditChanged(selectedEdit);
                    }
                }
            },

            archiveLastCompletedEdit: function(edit) {
                if (edit.completed && !edit.isArchived) {
                    edit.isArchived = true;
                    ProoferService.saveComment(edit);
                }
            },

            getFilteredEdits: function(filter) {
                filter = filter || this.state.filter;
                var currentSpread = this.props.currentSpread || {};
                var comments = ProoferService.getComments();
                var filters = {
                    'all': function(c) { return !c.isArchived; },
                    'archived': function(c) { return !!c.isArchived; },
                    'spread': function(c) { return !c.isArchived && c.spreadId===currentSpread._id; },
                    'pending': function(c) { return !c.isArchived && !c.completed; },
                    'completed': function(c) { return !c.isArchived && c.completed; },
                }
                var edits = _.filter(comments, filters[filter]).reverse();

                edits = _.sortBy(edits, function(c) {
                    var spreadNumber = c.spread ? c.spread.spreadNumber : 0,
                        imageNumber = c.element ? c.element.imageNumber : 0;
                    return spreadNumber * 1000 + imageNumber;
                });
                return edits;
            },

            gotoEdit: function(dir) {
                var edits = this.getFilteredEdits();
                if (edits.length===0) return;
                var edit = this.state.selectedEdit || edits[0];
                var currentEdit = _.findWhere(edits, {id:edit.id});
                var idx = edits.indexOf(currentEdit) + dir;
                idx = (idx + edits.length) % edits.length;
                this.setSelectedEdit(edits[idx], true);
            },

            onUnreadBadgeClicked: function() {
                var comments = ProoferService.getComments(),
                    user = this.props.user;
                for (var i = 0; i < comments.length; i++) {
                    var c = comments[i],
                        found = false;
                    var replies = [c].concat(c.replies);
                    var found = _.find(replies, function(r) {
                        return r.user.id!==user.id && !r.isRead;
                    });
                    if (found) {
                        this.setSelectedEdit(c, true);
                        break;
                    }
                }
            },

            onNextEditClicked: function() {
                this.gotoEdit(1);
            },

            onPrevEditClicked: function() {
                this.gotoEdit(-1);
            },

            onLayoutChanged: function() {
                ProoferService.refreshModel();
                this.forceUpdate();
            },

            onFilterClicked: function(e, filter) {
                this.setState({filter:filter});
                var edits = this.getFilteredEdits(filter);
                if (edits.length>0) {
                    this.setSelectedEdit(edits[0], true);
                }
            },

            onFindImage: function(e, image) {
                if (this.props.brideMode) return;
                var comments = ProoferService.getComments();
                var edit = _.find(comments, function(c) {
                    return !c.isArchived && c.element && c.element.imageFile && c.element.imageFile.id===image.id;
                });
                if (edit) {
                    this.setSelectedEdit(edit);
                }
            },

            onCommentTyping: function(e, comment) {
                //console.log('comment typing', comment);
                this.setState({typing:true, typingComment:comment, typingTime:Date.now()});
            },

            onCommentCreated: function(event, comment) {
                var edit = comment;
                if (comment.parent) {
                    var comments = ProoferService.getComments();
                    edit = _.findWhere(comments, comment.parent);
                }
                this.setSelectedEdit(edit);
            },

            onCommentsChange: function() {
                var force = true;
                if (this.loadingComments) {
                    this.loadingComments = false;
                }

                if (this.state.selectedEdit && this.state.selectedEdit.id) {
                    var comments = ProoferService.getComments();
                    var edit = _.findWhere(comments, {id:this.state.selectedEdit.id});
                    if (!edit) {
                        this.setSelectedEdit(null);
                        force = false;
                    }
                }
                if (force) this.forceUpdate();
            },

            onArrowClick: function(item, e) {
                this.setSelectedEdit(item, true);
            },

            onItemClick: function(item, e) {
                if (this.props.onEditClick) this.props.onEditClick(item);
            },

            onCompletedClick: function(item, e) {
                item.completed = !item.completed;
                item.isArchived = false;
                ProoferService.saveComment(item);
            },

            onDeleteClick: function(item, e) {
                var that = this;
                MessageService.confirm('Do you really want to delete this comment? This action cannot be undone.', function() {
                    ProoferService.deleteComment(item);
                    that.setSelectedEdit(null);
                });
            },

            onSelectedEditDeleteClick: function(e) {
                this.onDeleteClick(this.state.selectedEdit);
            },

            onSelectedEditCompletedClick: function(e) {
                this.onCompletedClick(this.state.selectedEdit);
            },

            onCommentInputChange: function(e) {
                this.setState({commentText: e.target.value});

                var parent = this.state.selectedEdit,
                    currentSpread = this.props.currentSpread;
                if (!parent) {
                    var comments = ProoferService.getComments();
                    parent = _.find(comments, function(c) {
                        return c.spreadId === currentSpread._id && !c.element;
                    });
                }
                var c = {
                    user: this.props.user,
                    parent: parent ? _.pick(parent, 'id', 'version') : null,
                    layout: _.pick(this.props.layout, 'id', 'version')
                };
                ProoferService.sendTypingEvent(c);
            },

            onSendClick: function(e) {
                if (!this.state.commentText || this.state.commentText.length===0) return;

                var selectedEdit = this.state.selectedEdit,
                    currentSpread = this.props.currentSpread;

                var parent = selectedEdit;
                if (!parent) {
                    var comments = ProoferService.getComments();
                    parent = _.find(comments, function(c) {
                        return c.spreadId === currentSpread._id && !c.element;
                    });
                }

                var comment = {
                    text: this.state.commentText,
                    user: this.props.user,
                    spreadId: currentSpread._id,
                    parent: parent ? _.pick(parent, 'id') : null,
                    revision: this.props.layout.revision,
                    layout: _.pick(this.props.layout, 'id'),
                    dateCreated: (new Date()).toISOString()
                };

                ProoferService.saveComment(comment);
                this.setState({commentText:''});
                if (!parent) {
                    this.setSelectedEdit(comment);
                } else if (parent!==selectedEdit) {
                    this.setSelectedEdit(parent);
                }

                if (e) {
                    //hide keyboard on iPad
                    document.activeElement.blur();
                }
            },

            onBackClick: function(e) {
                if (!this.state.selectedEdit) return;
                this.setSelectedEdit(null, true);
            },

            onCommentTextKeydown: function(e) {
                if (e.keyCode===13) {
                    this.onSendClick();
                }
            },

            onFilterChanged: function(val) {
                this.setState({filter:val});
                this.props.onFilterChanged(val);
            },

            onApproveClick: function(e) {
                if (this.props.onApproveClick) this.props.onApproveClick();
            },

            componentDidUpdate: function () {
                var edit = this.state.selectedEdit,
                    user = this.props.user;
                if (edit) {
                    var comments = [edit];
                    if (edit.replies) {
                        comments = comments.concat(edit.replies);
                    }
                    var changed = [];
                    _.each(comments, function(c) {
                        if (c.text && c.text.length>0 && !c.isRead && c.user.id!==user.id) {
                            c.isRead = true;
                            changed.push(c);
                        }
                    });
                    if (changed.length>0) {
                        if (changed.indexOf(edit)>=0) {
                            ProoferService.saveComment(edit);
                        } else {
                            _.each(changed, function(c) {
                                ProoferService.saveComment(c);
                            });
                        }
                    }
                }
                if (this.state.typing) {
                    var that = this;
                    setTimeout(function() {
                        if (that.state.typing && Date.now() - that.state.typingTime > 1000) {
                            that.setState({typing:false});
                        }
                    }, 1100);
                }
            },

            render: function() {
                var commentsView = !!this.state.selectedEdit;

                if (!this.props.layout) {
                    return ( React.createElement("div", {className: "proofer-component"}) );
                }

                var currentSpread = this.props.currentSpread || {};
                var edits = this.getFilteredEdits();
                var selectedEdit = this.state.selectedEdit || this.state.lastSelectedEdit,
                    comments = [];

                if (selectedEdit) {
                    comments = [selectedEdit];
                    if (selectedEdit.replies) {
                        var replies = _.sortBy(selectedEdit.replies, function(c) {
                            return new Date(c.dateCreated).getTime();
                        });
                        comments = comments.concat(replies);
                    }
                }

                var prooferComponentClass = 'proofer-component ';
                var prooferContentClass = 'proofer-component__content ';
                var prooferFooterClass = 'proofer-component__footer ';

                var listWrapperStyles = {
                    left: commentsView ? '-100%' : '0'
                };

                var filterOptions = [
                    {
                        label: 'All',
                        id: 'all'
                    },
                    {
                        label: 'Archived',
                        id: 'archived'
                    },
                    {
                        label: 'Completed',
                        id: 'completed'
                    },
                    {
                        label: 'Pending',
                        id: 'pending'
                    },
                    {
                        label: 'Per Spread',
                        id: 'spread'
                    },
                ];
                var typing = (this.state.typing && this.state.typingComment && this.state.typingComment.parent &&
                    this.props.user && this.props.user.id!==this.state.typingComment.user.id &&
                    this.state.selectedEdit && this.state.selectedEdit.id===this.state.typingComment.parent.id);

                var approveLabel = this.props.prooferSettings && this.props.prooferSettings.approved ? 'Unapprove album' : 'Approve album';

                //console.log('ProoferComponent render', edits);
                return (
                    React.createElement("div", {className: prooferComponentClass}, 

                        React.createElement("div", {className: "proofer-component__header"}, 
                            
                            React.createElement("header", {className: "header-back dark small"}, 
                                React.createElement("button", {onClick: this.onBackClick, className: "button dark back small double"}, "Back"), 
                                React.createElement("div", null, 
                                    React.createElement("h1", null, "Comment Snapshots"), 
                                    React.createElement("small", null, "See all your edits")
                                )
                            ), 

                            React.createElement(AngularDropdownComponent, {
                                color: "dark", 
                                onChange: this.onFilterChanged, 
                                options: filterOptions, 
                                labelField: "label", 
                                valueField: "id", 
                                direction: "down", 
                                containerClass: "angular-dropdown-container--full-space", 
                                class: "proofer-component__filter", 
                                selectedItem: this.state.filter, 
                                disabled: !!this.state.selectedEdit})

                        ), 

                        React.createElement("div", {className: prooferContentClass}, 
                            React.createElement("div", {className: "proofer-component__list-wrapper", style: listWrapperStyles}, 

                                React.createElement(EditListComponent, {
                                    comments: edits, 
                                    user: this.props.user, 
                                    spread: currentSpread, 
                                    onArrowClick: this.onArrowClick, 
                                    onItemClick: this.onItemClick, 
                                    onDeleteClick: this.onDeleteClick, 
                                    onCompletedClick: this.onCompletedClick, 
                                    isSpreadBased: this.props.isSpreadBased}), 

                                React.createElement("div", {className: "proofer-component__comments"}, 

                                    
                                        selectedEdit &&
                                        React.createElement(EditComponent, {
                                            comment: selectedEdit, 
                                            user: this.props.user, 
                                            pageNum: currentSpread.pageNumber, 
                                            header: true, 
                                            onDeleteClick: this.onSelectedEditDeleteClick, 
                                            onCompletedClick: this.onSelectedEditCompletedClick, 
                                            isSpreadBased: this.props.isSpreadBased}), 
                                    

                                    React.createElement(CommentListComponent, {
                                        typing: typing, 
                                        comments: comments, 
                                        user: this.props.user})
                                )

                            )
                        ), 
                        React.createElement("div", {className: prooferFooterClass}, 
                            
                                React.createElement("div", {className: "proofer__type-message"}, 
                                    React.createElement("input", {type: "text", value: this.state.commentText, 
                                        onChange: this.onCommentInputChange, 
                                        onKeyDown: this.onCommentTextKeydown, 
                                        className: "dark proofer__type-message__input"}), 
                                    React.createElement("button", {className: "dark proofer__type-message__btn", onClick: this.onSendClick}, "Send")
                                ), 
                            
                            React.createElement("button", {className: "button dark clear-margin-bottom proofer-component__footer__approve-album", 
                                onClick: this.onApproveClick}, approveLabel)
                        )
                    )
                );
            }
        });
    }

]);
