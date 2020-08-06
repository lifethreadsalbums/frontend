angular.module('pace.order')
.factory('PrintsContainerListComponent', ['$state', 'DropdownComponent', 'StoreConfig', 'AngularDropdownComponent', 
    'GeomService', 'PrintsContainerComponent', 'PaceTooltipService', 'PrintsGridComponent',
    function($state, DropdownComponent, StoreConfig, AngularDropdownComponent, 
        GeomService, PrintsContainerComponent, PaceTooltipService, PrintsGridComponent) {

        var CSSTransitionGroup = ReactTransitionGroup.CSSTransitionGroup;

        return React.createClass({

            propTypes: {
                layouts: React.PropTypes.array.isRequired,
                layout: React.PropTypes.object.isRequired,
                product: React.PropTypes.object.isRequired,
                layoutSizeOption: React.PropTypes.object.isRequired,
                onContainerClick: React.PropTypes.func.isRequired,
                onContainerRemoveClick: React.PropTypes.func.isRequired,
                onContainerDrop: React.PropTypes.func.isRequired,
                onContainerQuantityChange:  React.PropTypes.func.isRequired,
                onContainerSizeChange: React.PropTypes.func.isRequired,
                onToolbarClick: React.PropTypes.func.isRequired,
                onCurrentImageChange: React.PropTypes.func.isRequired,
                onImageRemoveClick: React.PropTypes.func.isRequired,
                selectedContainer: React.PropTypes.object,
                layoutController: React.PropTypes.object.isRequired,
                editable: React.PropTypes.bool.isRequired,
                canvasMode: React.PropTypes.bool.isRequired
            },

            getInitialState: function () {
                return { selectedContainer: this.props.selectedContainer };
            },

            componentWillReceiveProps: function (nextProps) {
                if (this.state.selectedContainer!==nextProps.selectedContainer) {
                    this.setState({selectedContainer:nextProps.selectedContainer});
                }
                if (nextProps.layouts && nextProps.layouts.length!==this.lastNumContainers && !this.state.selectedContainer) {
                    this.doTransition = true;
                }
            },

            componentDidMount: function () {
                this.initialRender = true;
                this.forceUpdate();

                this.props.layoutController.on('prints:selection-cleared', this.onSelectionCleared.bind(this));
                window.addEventListener('resize', this.onResize);
                PaceTooltipService.start(ReactDOM.findDOMNode(this));
            },

            componentWillUnmount: function () {
                PaceTooltipService.stop(ReactDOM.findDOMNode(this));
                window.removeEventListener('resize', this.onResize);
            },

            componentDidUpdate: function() {

                if ((this.initialRender && !this.state.selectedContainer) || this.doTransition) {
                    var rootNode = ReactDOM.findDOMNode(this);
                    var viewRect = rootNode.getBoundingClientRect();
                    var scrollFrom = rootNode.scrollLeft;
                    var scrollTo = rootNode.scrollWidth/2 - viewRect.width/2;
                    var shouldAnimate = !this.initialRender || Math.abs(scrollFrom - scrollTo)>10;
                    if (this.props.layouts.length===1) {
                        shouldAnimate = false;
                    }
                    this.doTransition = false;
                    this.initialRender = false;

                    if (shouldAnimate) {
                        fabric.util.animate({
                            startValue: 0,
                            endValue: 1,
                            duration: 600,
                            onChange: function(value) {
                                var scrollTo = rootNode.scrollWidth/2 - viewRect.width/2;
                                rootNode.scrollLeft = scrollFrom + ((scrollTo - scrollFrom) * value);
                            },
                        });
                    } else {
                        rootNode.scrollLeft = scrollTo;
                    }
                }

            },

            onResize: function() {
                this.forceUpdate();
            },

            onSelectionCleared: function(renderer, options) {
                if (this.props.layoutController.currentRenderer && this.props.layoutController.currentRenderer.layout &&
                    this.state.selectedContainer &&
                    this.props.layoutController.currentRenderer.layout._id === this.state.selectedContainer._id) {

                    //find 
                    var container = null,
                        x = options.e.pageX,
                        y = options.e.pageY;

                    var elements = document.querySelectorAll('li.prints-container');
                    for (var i = 0; i < elements.length; i++) {
                        var el = elements[i];
                        var r = el.getBoundingClientRect();
                        if (x >= r.left && x <= r.right && 
                            y >= r.top  && y <= r.bottom && 
                            i<this.props.layouts.length) {
                            
                            container = this.props.layouts[i];
                            break;
                        }
                    }

                    this.setState({selectedContainer:container});
                    this.props.onContainerClick(container);
                }
            },

            onContainerClick: function(container, event) {
                if (event===null) {
                    container = null;
                } else {
                    //event.stopPropagation();
                }
                this.setState({selectedContainer:container});
                this.props.onContainerClick(container, event);
            },

            onContainerChange: function(dir, e) {
                e.stopPropagation();
                var containers = this.props.layouts;

                var idx = containers.indexOf(this.state.selectedContainer);
                idx = (idx + dir + containers.length) % containers.length;

                this.onContainerClick(containers[idx], e);
            },

            onClick: function(e) {
                var rootNode = ReactDOM.findDOMNode(this);
                if (e.target!==rootNode) return;

                this.setState({selectedContainer:null});
                this.props.onContainerClick(null, e);
                this.props.layoutController.clearSelection(true);
            },

            render: function() {
                var rootNode = ReactDOM.findDOMNode(this),
                    containerRect,
                    maxHeight,
                    viewMode = this.props.layout.viewState.viewMode,
                    product = this.props.product,
                    isZoomed = viewMode==='single',
                    containers = this.props.layouts;

                if (!rootNode) {
                    //initial render
                    containers = [];
                } else {
                    containerRect = rootNode.getBoundingClientRect();
                }

                this.lastNumContainers = containers.length;
                if (this.state.selectedContainer) {
                    this.lastSelectedContainer = this.state.selectedContainer;
                }

                function getLayoutSizeHeight(layout) {
                    return layout.originalLayoutSize ? layout.originalLayoutSize.height : layout.layoutSize.height;
                }

                if (containers.length>0) {
                    maxHeight = getLayoutSizeHeight( _.max(containers, getLayoutSizeHeight) );
                }

                var ulClasses = classNames({
                    'prints-containers-top': true,
                    'prints-containers-top--zoomed': isZoomed
                });

                return (
                    <ul className={ulClasses} onMouseUp={this.onClick}>
                        {
                        //<CSSTransitionGroup transitionName="prints-container-list-animation"
                        //    transitionEnterTimeout={600}
                        //    transitionLeaveTimeout={600}>
                        }
                            {
                                containers.map(function (container, i) {

                                    var step = getLayoutSizeHeight(container) / maxHeight,
                                        isSelected = container===this.state.selectedContainer;

                                    container._id = container._id || _.uniqueId('layout-') + _.now();
                                    var currentImageIndex = container.currentImageIndex || 0;
                                    var isMiddle = !this.state.selectedContainer && Math.floor(containers.length/2)===i;
                                    isMiddle = this.lastSelectedContainer == container;

                                    return (
                                        <PrintsContainerComponent
                                            key={container._id}
                                            onContainerClick={this.onContainerClick.bind(this, container)}
                                            onContainerDrop={this.props.onContainerDrop.bind(this, container)}
                                            onContainerRemoveClick={this.props.onContainerRemoveClick.bind(this, container)}
                                            onContainerQuantityChange={this.props.onContainerQuantityChange}
                                            onContainerSizeChange={this.props.onContainerSizeChange}
                                            onToolbarClick={this.props.onToolbarClick}
                                            onCurrentImageChange={this.props.onCurrentImageChange}
                                            onImageRemoveClick={this.props.onImageRemoveClick}
                                            layoutController={this.props.layoutController}
                                            container={container}
                                            elements={container.spreads}
                                            product={container.product}
                                            currentImageIndex={currentImageIndex}
                                            layoutSizeOption={this.props.layoutSizeOption}
                                            isSelected={isSelected}
                                            fillMode={this.props.layout.viewState.fillMode}
                                            containerRect={containerRect}
                                            canvasMode={this.props.canvasMode}
                                            step={step}
                                            isMiddle={isMiddle}
                                            viewMode={viewMode}
                                            tweakZIndex={true}
                                            numContainers={containers.length}
                                            editable={this.props.editable} />
                                    );
                                    

                                }, this)
                            }
                        {
                        //</CSSTransitionGroup>
                        }

                        {

                            isZoomed &&
                            <span className="prints-container__arrow prints-container__arrow--single prints-container__arrow--left"
                                onClick={this.onContainerChange.bind(this, -1)}
                                data-pace-tooltip="See previous size">
                                <img className="prints-container__arrow-icon prints-container__arrow-icon--single"
                                    src="/images/prints/prints-slider-left-arrow-gray-wide-angle.svg" alt="Previous"/>
                            </span>

                        }
                        {

                            isZoomed &&
                            <span className="prints-container__arrow prints-container__arrow--single prints-container__arrow--right"
                                onClick={this.onContainerChange.bind(this, 1)}
                                data-pace-tooltip="See next size">
                                <img className="prints-container__arrow-icon prints-container__arrow-icon--single prints-container__arrow-icon--right"
                                    src="/images/prints/prints-slider-left-arrow-gray-wide-angle.svg" alt="Next"/>
                            </span>

                        }
                    </ul>
                );
            }
        });
    }

]);
