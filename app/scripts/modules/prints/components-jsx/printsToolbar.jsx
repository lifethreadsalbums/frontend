angular.module('pace.order')
.factory('PrintsToolbarComponent', ['$state', '$controller', 'StoreConfig', 'AngularDropdownComponent', 'GeomService',
    'PaceTooltipService', 'TextEditorService', 'SpreadToolbarService', 'optionVisibilityFilter',
    function($state, $controller, StoreConfig, AngularDropdownComponent, GeomService,
        PaceTooltipService, TextEditorService, SpreadToolbarService, optionVisibilityFilter) {

        var CSSTransitionGroup = ReactTransitionGroup.CSSTransitionGroup;

        return React.createClass({

            propTypes: {
                layout: React.PropTypes.object.isRequired,
                layoutSizeOption: React.PropTypes.object.isRequired,
                onContainerQuantityChange:  React.PropTypes.func.isRequired,
                onContainerSizeChange: React.PropTypes.func.isRequired,
                onToolbarClick: React.PropTypes.func.isRequired,
                onToolsetChange: React.PropTypes.func.isRequired,
                selectedContainer: React.PropTypes.object,
                layoutController: React.PropTypes.object.isRequired,
                canvasMode: React.PropTypes.bool.isRequired,
                bordersEnabled: React.PropTypes.bool.isRequired
            },

            getInitialState: function () {
                var qtyOptions = _.times(10, function(i) { return {id:i+1, label: i+1}; });
                var currentToolset = this.props.layout && this.props.layout.viewState &&
                        this.props.layout.viewState.toolbar ? this.props.layout.viewState.toolbar : 'tools2';

                return {
                    qtyOptions: qtyOptions,
                    currentToolset: currentToolset,
                    selectedFilter: 'bw',
                    selectedFlip: 'horizontal'
                };
            },

            //------------------------------------------------------
            //----------------- Helper functions -------------------
            //------------------------------------------------------
            getAvailableSizes: function() {
                var sizes = [],
                    sizeType = this.getSizeType(this.props.selectedContainer.layoutSize),
                    sizeOptions = this.props.layoutSizeOption.prototypeProductOptionValues;

                var sizeOptions = optionVisibilityFilter(sizeOptions, this.props.selectedContainer.product);

                for (var i = 0; i < sizeOptions.length; i++) {
                    var sizeOption = sizeOptions[i];
                    //console.log(sizeOption)
                    if (sizeType === this.getSizeType(sizeOption.layoutSize)) {
                        sizes.push({
                            id: sizeOption.code,
                            label: sizeOption.displayName,
                            sizeConfig: sizeOption
                        });
                    }
                }
                return sizes;
            },

            getSizeType: function(layoutSize) {
                var sizeType,
                    width = layoutSize.width,
                    height = layoutSize.height;

                if (width > height) {
                    sizeType = 'horizontal';
                } else if (width < height) {
                    sizeType = 'vertical';
                } else {
                    sizeType = 'square';
                }
                if (layoutSize.gridX>0) {
                    sizeType += '-grid';
                }
                if (layoutSize.templateSpread) {
                    sizeType += '-template-'+layoutSize.templateSpread.id;
                }

                return sizeType;
            },

            getCurrentElement: function() {
                var container = this.props.selectedContainer;
                if (container && container.currentImageIndex >= 0 && container.currentImageIndex < container.spreads.length) {
                    return _.findWhere(container.spreads[container.currentImageIndex].elements, {type:'ImageElement'});
                }
            },

//------------------------------------------------------
//-------------- React live cycle stuff ----------------
//------------------------------------------------------
            componentDidMount: function () {
                this.listeners = [
                    this.props.layoutController.on('build-product-saved', this.onProductSaved.bind(this)),
                    this.props.layoutController.on('layout:selection-modified', this.onSelectionModified.bind(this)),
                    this.props.layoutController.on('layout:selection-changed', this.onSelectionModified.bind(this)),
                    this.props.layoutController.on('layout:current-editor-changed', this.onSelectionModified.bind(this)),
                    this.props.layoutController.on('prints:toolbar-changed', this.onToolbarChanged.bind(this)),
                ];
                PaceTooltipService.start(ReactDOM.findDOMNode(this));
            },

            componentWillUnmount: function () {
                _.each(this.listeners, function(listener) { listener(); });
                this.listeners = null;
                PaceTooltipService.stop(ReactDOM.findDOMNode(this));
            },

            componentDidUpdate: function() {
                //update qty input
                if (this.refs.qtyInput) {
                    var elNode = ReactDOM.findDOMNode(this.refs.qtyInput);
                    var qty = '--';
                    if (this.props.selectedContainer) {
                        qty = this.props.selectedContainer.product.options._quantity
                    }
                    elNode.value = qty;
                }
            },

//------------------------------------------------------
//----------------- Event handers ----------------------
//------------------------------------------------------
            onProductSaved: function() {
                if (!this.props.selectedContainer) return;

                var product = this.props.selectedContainer.product;
                var price = product ? product.subtotal.displayPrice : '$0';
                var size = product ? product.options.size : null;
                if (price!==this.price || size!==this.size) {
                    this.forceUpdate();
                }
            },

            onToolbarChanged: function(event, idx) {
                var toolbar = 'tools' + idx;
                this.setState({
                    previousToolset: this.state.currentToolset,
                    currentToolset: toolbar
                });
            },

            onSelectionModified: function() {
                setTimeout(this.forceUpdate.bind(this));
            },

            fixQty: function(value) {
                var target,
                    refresh = false;
                if (typeof value === 'object') {
                    target = value.target;
                    value = value.target.value;
                }

                if (value==='') return;

                if (_.isString(value)) {
                    var intValue = parseInt(value);
                    if ((intValue+'').length!==value.length) {
                        refresh = true;
                    }
                    value = intValue;
                }

                if (!value || value == 0) {
                    value = 1;
                    refresh = true;
                }
                if (target && refresh) {
                    target.value = value;
                }
                return value;
            },

            onQtyInputFocus: function(event) {
                event.target.select();
            },

            onContainerQtyChange: function(value) {
                value = this.fixQty(value);
                if (!value) return;

                var product = this.props.selectedContainer.product;
                product.options._quantity = value;
                this.forceUpdate();
                this.props.onContainerQuantityChange(this.props.container);
            },

            onContainerQtyBlur: function(event) {
                var value = event.target.value;
                if (_.isEmpty(value)) {
                    event.target.value = 1;
                    this.onContainerQtyChange(event);
                }
            },

            onTextOptionsChanged: function(prop, val) {
                var el = this.props.layoutController.selectedElements[0];
                if (!el || !(el.type==='TextElement' || el.type==='SpineTextElement')) return;

                var textOpt = {};
                textOpt[prop] = val;
                TextEditorService.applyForSelection(this.props.layoutController, textOpt, prop);
            },

            onFilterChanged: function(val) {
                this.setState({selectedFilter:val});
                var el = this.getCurrentElement();
                
                if (el && el.filter) {
                    el.filter = val;
                    this.forceUpdate();
                    var that = this;
                    setTimeout(function() {
                        that.props.onToolbarClick(val);    
                    });
                }
            },

            onFilterClick: function() {
                this.props.onToolbarClick(this.getCurrentFilter());
            },

            getCurrentFilter: function() {
                var el = this.getCurrentElement();
                return el && el.filter ? el.filter : this.state.selectedFilter
            },

            onFlipChanged: function(val) {
                this.setState({selectedFlip:val});
                var el = this.getCurrentElement();
                
                if (el && (el.flipX || el.flipY)) {
                    if (val==='horizontal') {
                        el.flipY = false;
                    } else {
                        el.flipX = false;
                    }
                    this.props.onToolbarClick('flip-' + val);    
                }
            },

            onFlipClick: function() {
                this.props.onToolbarClick('flip-'+this.getCurrentFlip());
            },

            getCurrentFlip: function() {
                var el = this.getCurrentElement();
                if (el && el.flipX)
                    return 'horizontal';
                else if (el && el.flipY)
                    return 'vertical'

                return this.state.selectedFlip;
            },

            onToolsetChange: function(selectedItem) {
                this.setState({
                    previousToolset: this.state.currentToolset,
                    currentToolset: selectedItem
                });
                this.props.layout.viewState.toolbar = selectedItem;
                this.props.layoutController.fireEvent('layout:layout-changed');

                this.props.onToolsetChange(selectedItem);
            },

            onContainerSizeChange: function(id) {
                this.props.layoutController.fireEvent('prints:container-size-changed', id);
            },

            toggleBold: function() {
                SpreadToolbarService.toggleBold(this.props.layoutController);
            },

            toggleItalic: function() {
                SpreadToolbarService.toggleItalic(this.props.layoutController);
            },

//------------------------------------------------------
//---------------------- Render  -----------------------
//------------------------------------------------------
            render: function() {
                var container = this.props.selectedContainer,
                    product,
                    qty = 'none',
                    price,
                    currentElement = this.getCurrentElement(),
                    isEmpty,
                    qtyOptions = [{id:'none', label:'--'}],
                    sizeOptions = [{id:'none', label:'     ---  '}],
                    size = 'none',
                    disabled = true,
                    isGrid = false,
                    bordersEnabled = this.props.bordersEnabled,
                    blackAndWhiteBorders = false;

                if (container) {
                    isGrid = container.layoutSize.gridX>0;
                    disabled = false;
                    product = container.product;
                    qty = product.options._quantity;
                    price = product.subtotal ? product.subtotal.displayPrice : '$0';
                    isEmpty = container.spreads.length===0;
                    size = product.options.size;
                    sizeOptions = this.getAvailableSizes();
                    qtyOptions = this.state.qtyOptions;

                    var sizeValues = this.props.layoutSizeOption.prototypeProductOptionValues;
                    var sizeVal = _.findWhere(sizeValues, {code: size});
                    if (sizeVal && sizeVal.effectiveParams && sizeVal.effectiveParams.blackAndWhiteBorders) {
                        blackAndWhiteBorders = true;
                    }
                }

                //console.log('toolbar refresh', container, currentElement);
                this.price = price;
                this.size = size;
                
                var activeToolClass = ' active active-pressed',
                    centerToolClasses = 'tool tool-center',
                    flipHorizontalClasses = 'tool tool-flip-contenth',
                    flipVerticalClasses = 'tool tool-flip-contentv',
                    borderClasses = 'tool tool-white-borders',
                    blackBorderClasses = 'tool tool-black-borders',
                    whiteBorderClasses = 'tool tool-white-borders',
                    blackAndWhiteClasses = 'tool tool-filter-black-and-white',
                    sepiaClasses = 'tool tool-filter-sepia-black-and-white',
                    filterActive = false,
                    selectedFilter = this.getCurrentFilter(),
                    flipActive = false,
                    selectedFlip = this.getCurrentFlip();
                    
                //toolbar state
                if (currentElement) {
                    var el = currentElement;
                    var el2 = _.clone(el);
                    new PACE.CenterContentCommand(el2).execute();
                    var eq = GeomService.equals;
                    var isCentered = eq(el.imageX, el2.imageX, 0.01) &&
                        eq(el.imageY, el2.imageY, 0.01) &&
                        eq(el.imageWidth, el2.imageWidth, 0.01) &&
                        eq(el.imageHeight, el2.imageHeight, 0.01);

                    if (isCentered) centerToolClasses += activeToolClass;
                    if (el.flipX) flipHorizontalClasses += activeToolClass;
                    if (el.flipY) flipVerticalClasses += activeToolClass;
                    if (el.strokeWidth>0) borderClasses += activeToolClass;
                    if (el.filter==='bw') blackAndWhiteClasses += activeToolClass;
                    if (el.filter==='sepia') sepiaClasses += activeToolClass;

                    filterActive = (el.filter==='bw' || el.filter==='sepia');
                    flipActive = !!(el.flipX || el.flipY);

                    if (blackAndWhiteBorders) {
                        var container = this.props.selectedContainer;
                        if (container && container.currentImageIndex >= 0 && container.currentImageIndex < container.spreads.length) {
                            el = _.findWhere(container.spreads[container.currentImageIndex].elements, {type:'BackgroundFrameElement'});
                            if (el) {
                                if (el.backgroundColor==='#ffffff') 
                                    whiteBorderClasses += activeToolClass;
                                else
                                    blackBorderClasses += activeToolClass;
                            }
                        }
                    }
                }

                var ctrl = this.props.layoutController;
                var textToolActive = ctrl.currentTool instanceof PACE.TextTool ||
                    ctrl.currentEditor instanceof PACE.TextEditor;

                var textElementSelected = ctrl.selectedElements.length===1 &&
                    (ctrl.selectedElements[0].type==='TextElement' || ctrl.selectedElements[0].type==='SpineTextElement');

                var textOpt = {};
                if (textElementSelected) {
                    textOpt = TextEditorService.getMergedFontStyle(ctrl.selectedElements[0]);
                }

                var textAlignOptions = [
                    {value: 'left', icon: 'left'},
                    {value: 'center', icon: 'center'},
                    {value: 'right', icon: 'right'},
                    {value: 'justify', icon: 'justify'}
                ];
                if (ctrl.selectedElements.length===1 && ctrl.selectedElements[0].type==='SpineTextElement') {
                    textAlignOptions = textAlignOptions.slice(0, 3);
                }

                var filterTooltip = this.state.selectedFilter==='bw' ? 'Make this photo Black & White' : 'Make this photo Sepia';
                var flipTooltip = selectedFlip==='vertical' ? 'Vertical Content Flip' : 'Horizontal Content Flip';

                var bottomToolsetClass = 'toolset';
                if (!this.props.canvasMode) {
                    bottomToolsetClass += ' switch-on';
                }

                return (

                    <div>
                        <div className="qa-edit-toolbar qa-edit-toolbar-up top-toolbar qa-edit-toolbar--prints">
                            <div className="toolset">
                                <div className="prints-container-copies" data-pace-tooltip="Copies of each photo">
                                    <AngularDropdownComponent
                                        disabled={disabled}
                                        containerClass="angular-dropdown-container--flex"
                                        class="dropdown-button--prints-container-copies dark-transparent"
                                        onChange={this.onContainerQtyChange}
                                        options={qtyOptions}
                                        labelField="label"
                                        valueField="id"
                                        direction="down"
                                        color="dark"
                                        selectedItem={qty}/>

                                    <input ref="qtyInput" className="prints-container-copies__input" type="text"
                                        disabled={disabled}
                                        defaultValue="--"
                                        onFocus={this.onQtyInputFocus}
                                        onBlur={this.onContainerQtyBlur}
                                        onChange={this.onContainerQtyChange} />

                                </div>

                                <AngularDropdownComponent
                                    disabled={disabled}
                                    containerClass="angular-dropdown-container--flex"
                                    class="dropdown-button--prints-size dark-transparent"
                                    onChange={this.onContainerSizeChange}
                                    options={sizeOptions}
                                    labelField="label"
                                    valueField="id"
                                    direction="down"
                                    color="dark"
                                    selectedItem={size}
                                    paceTooltip="Size"/>

                                <span className="toolset__text" data-pace-tooltip="Price">{price}</span>
                            </div>
                        </div>

                        <div className="qa-edit-toolbar qa-edit-toolbar-down bottom-toolbar qa-edit-toolbar--prints">
                            <CSSTransitionGroup
                                transitionName="toolset-slide">

                                {
                                    this.state.currentToolset === 'tools2' &&
                                    <div className={bottomToolsetClass}>
                                        <div className="tooltip__box tooltip__box--button" data-pace-tooltip="Center Image (C)">
                                            <span className={centerToolClasses}
                                                disabled={disabled}
                                                onClick={this.props.onToolbarClick.bind(this, 'center')}>
                                            </span>
                                        </div>

                                        <AngularDropdownComponent
                                            disabled={disabled}
                                            onChange={this.onFilterChanged}
                                            onClick={this.onFilterClick}
                                            type="icon"
                                            icon="image-filters"
                                            valueField="value"
                                            active={filterActive}
                                            direction="down"
                                            color="dark"
                                            selectedItem={selectedFilter}
                                            paceTooltip={filterTooltip} />

                                        <AngularDropdownComponent
                                            disabled={disabled}
                                            onChange={this.onFlipChanged}
                                            onClick={this.onFlipClick}
                                            type="icon"
                                            icon="content-flip"
                                            valueField="value"
                                            active={flipActive}
                                            direction="down"
                                            color="dark"
                                            selectedItem={selectedFlip}
                                            paceTooltip={flipTooltip} />

                                        

                                        {
                                            !bordersEnabled && blackAndWhiteBorders &&
                                            <div className="tooltip__box tooltip__box--button" data-pace-tooltip="Black Border">
                                                <span className={blackBorderClasses}
                                                    disabled={disabled}
                                                    onClick={this.props.onToolbarClick.bind(this, 'black-border')}>
                                                </span>
                                            </div>
                                        }

                                        {
                                            !bordersEnabled && blackAndWhiteBorders &&
                                            <div className="tooltip__box tooltip__box--button" data-pace-tooltip="White Border">
                                                <span className={whiteBorderClasses}
                                                    disabled={disabled}
                                                    onClick={this.props.onToolbarClick.bind(this, 'white-border')}>
                                                </span>
                                            </div>
                                        }

                                        {
                                            bordersEnabled && 
                                            <div className="tooltip__box tooltip__box--button" data-pace-tooltip="Add a Border to this photo">
                                                <span className={borderClasses}
                                                    disabled={disabled}
                                                    onClick={this.props.onToolbarClick.bind(this, 'border')}>
                                                </span>
                                            </div>
                                        }

                                        {
                                            bordersEnabled &&
                                            <div className="tooltip__box tooltip__box--button" data-pace-tooltip="Stroke styles">
                                                <span className="tool tool-stroke"
                                                    disabled={disabled}
                                                    onClick={this.props.onToolbarClick.bind(this, 'styles')}>
                                                </span>
                                            </div>
                                        }
                                    </div>
                                }
                                {
                                    this.state.currentToolset === 'tools4' &&
                                    <div className="toolset switch-on">
                                        <AngularDropdownComponent
                                            disabled={disabled}
                                            onChange={this.onTextOptionsChanged.bind(this, 'orientation')}
                                            onClick={this.props.onToolbarClick.bind(this, 'text-tool')}
                                            type="icon"
                                            icon="text-orientation"
                                            valueField="value"
                                            active={textToolActive}
                                            direction="down"
                                            color="dark"
                                            selectedItem={textOpt.orientation}
                                            paceTooltip="Text Tool"/>

                                        <AngularDropdownComponent
                                            disabled={disabled || !textElementSelected}
                                            onChange={this.onTextOptionsChanged.bind(this, 'align')}
                                            type="icon"
                                            icon="text-align"
                                            options={textAlignOptions}
                                            valueField="value"
                                            direction="down"
                                            color="dark"
                                            selectedItem={textOpt.textAlign}
                                            paceTooltip="Text Align"/>

                                        <AngularDropdownComponent
                                            disabled={disabled || !textElementSelected}
                                            onChange={this.onTextOptionsChanged.bind(this, 'case')}
                                            type="icon"
                                            icon="case"
                                            valueField="value"
                                            direction="down"
                                            color="dark"
                                            selectedItem={textOpt.case}
                                            paceTooltip="Text Case"/>

                                        <div className="tooltip__box tooltip__box--button" data-pace-tooltip="Bold">
                                            <span className="tool tool-bold"
                                                disabled={disabled || !textElementSelected}
                                                ng-className="{active:textOpt.bold}"
                                                onClick={this.toggleBold}
                                                ng-disabled="boldDisabled">
                                            </span>
                                        </div>
                                        <div className="tooltip__box tooltip__box--button" data-pace-tooltip="Italic">
                                            <span className="tool tool-italic"
                                                disabled={disabled || !textElementSelected}
                                                ng-class="{active:textOpt.italic}"
                                                onClick={this.toggleItalic}
                                                ng-disabled="italicDisabled">
                                            </span>
                                        </div>
                                    </div>
                                }

                            </CSSTransitionGroup>
                            {
                                !this.props.canvasMode &&
                                <div className="toolset-switch">
                                    <AngularDropdownComponent
                                        containerClass="angular-dropdown-container--full-space"
                                        onChange={this.onToolsetChange.bind(this)}
                                        type="icon"
                                        icon="design-tools-prints"
                                        direction="up"
                                        color="dark"
                                        selectedItem={this.state.currentToolset} />
                                </div>
                            }
                        </div>

                    </div>
                ); //end return
            }

        });
    }
]);
