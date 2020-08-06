'use strict';

angular.module('pace.build')
    .directive('boxPreview', ['GeomService', '$timeout', '$debounce', 'BumpMapService', '$controller',
    function(GeomService, $timeout, $debounce, BumpMapService, $controller) {
        return {
            scope: {
                coverLayout:'=',
                layoutController:'=',
                product:'=',
                productPrototype:'=',
                params:'='
            },
            replace: true,
            restrict: 'E',
            template: '<div class="cover-preview" ng-style="{\'margin-top\':marginTop}"> \
                            <canvas class="mainCanvas"></canvas> \
                            <spinner style="position:absolute;top:50%;left:50%"></spinner> \
                            <div style="display:none"> \
                                <canvas class="materialCanvas"></canvas> \
                            </div> \
                        </div>',
            link: function($scope, $element, $attrs) {

                function createRenderer(el, ctrlScope) {
                    ctrlScope.mode = 'CoverLeft';
                    var ctrl = $controller('SpreadController', { $element: el, $scope: ctrlScope, $attrs: {} });
                    ctrl.element = el;
                    ctrl.register();
                    return ctrl;
                }


                var layoutController = $scope.layoutController,

                    mainCanvas = $element.find('.mainCanvas'),
                    materialsCanvas = $element.find('.materialCanvas'),

                    mainRendererScope = $scope.$new(false),
                    materialRendererScope = $scope.$new(false),

                    mainRenderer = createRenderer(mainCanvas, mainRendererScope),
                    materialsRenderer = createRenderer(materialsCanvas, materialRendererScope),

                    containerClass = '.' + ($attrs.layoutContainer || 'builder__content-primary-inner'),
                    $canvasWrap = $element.closest(containerClass),
                    spinner = $element.find('.spinner-container'),
                    $window = $(window),
                    endPapersMode = $attrs.endPapers==='true';


                //------------------ CLAM SHELL ----------------------
                var clamShellSpecs = {
                    urlPrefix: 'images/cover-builder/cs-layer',
                    maskIndices: [1, 5, 7, 9],
                    size: {
                        width: 1000,
                        height: 477,
                    },
                    stampRatio: 0.9,
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'source-over',   opacity:1.0 }, //layer 3
                        { mode:'source-over',   opacity:1.0 }, //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'source-over',   opacity:1.0 }, //layer 6
                        { mode:'source-over',   opacity:1.0 }, //layer 7
                        { mode:'source-over',   opacity:1.0 }, //layer 8
                        { mode:'multiply', opacity:1.0 }, //layer 9
                        { mode:'source-over',   opacity:1.0 }, //layer 10
                        { mode:'multiply', opacity:1.0 }, //layer 11
                        { mode:'source-over',   opacity:1.0 }, //layer 12
                        { mode:'multiply', opacity:1.0 }, //layer 13
                        { mode:'multiply', opacity:1.0 }, //layer 14
                        { mode:'source-over',   opacity:1.0 }, //layer 15
                        { mode:'multiply', opacity:1.0 }, //layer 16
                    ],
                    elements: [
                        {
                            type:'PolygonMaterialElement',
                            points: [
                                {x:210, y:70},
                                {x:785, y:70},
                                {x:920, y:302},
                                {x:70, y:302}
                            ],
                            materialWidth: 600,
                            materialHeight: 600,
                            rotation:0,
                            optionCode: 'boxColour',
                            renderStamps: true,
                        },
                        {
                            type:'MaterialElement',
                            x: 71,
                            y: 300,
                            width: 848,
                            height: 116,
                            rotation:0,
                            optionCode: 'boxColour'
                        },

                        {
                            type:'PolygonMaterialElement',
                            materialWidth: 87,
                            materialHeight: 814,
                            points: [
                                {x:900, y:307},
                                {x:901, y:396},
                                {x:90, y:396},
                                {x:85, y:307},
                            ],
                            rotation:0,
                            optionCode: 'boxColour'
                        },

                        //clam shell tray
                        {
                            type:'PolygonMaterialElement',
                            materialWidth: 87,
                            materialHeight: 814,
                            points: [
                                {x:900, y:307},
                                {x:901, y:396},
                                {x:90, y:396},
                                {x:85, y:307},
                            ],
                            rotation:0,
                            optionCode: 'boxLinersWallsColour'
                        }
                    ]
                };

                //------------------ PRESENTATION BOX ----------------------
                var presBoxSpecs = {
                    urlPrefix: 'images/cover-builder/pbx-layer',
                    maskIndices: [1, 5, 7, 12, 14],
                    size: {
                        width: 1000,
                        height: 477,
                    },
                    stampRatio: 0.9,
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'source-over',   opacity:1.0 }, //layer 3
                        { mode:'source-over',   opacity:1.0 }, //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'source-over',   opacity:1.0 }, //layer 6
                        { mode:'source-over',   opacity:1.0 }, //layer 7
                        { mode:'source-over',   opacity:1.0 }, //layer 8
                        { mode:'multiply', opacity:1.0 }, //layer 9
                        { mode:'source-over',   opacity:1.0 }, //layer 10
                        { mode:'multiply', opacity:1.0 }, //layer 11
                        { mode:'multiply', opacity:1.0 }, //layer 12
                        { mode:'source-over',   opacity:1.0 }, //layer 13
                        { mode:'multiply', opacity:1.0 }, //layer 14
                        { mode:'source-over',   opacity:1.0 }, //layer 15
                        { mode:'multiply', opacity:1.0 }, //layer 16
                        { mode:'source-over',   opacity:1.0 }, //layer 17
                        { mode:'multiply', opacity:1.0 }, //layer 18
                        { mode:'source-over',   opacity:1.0 }, //layer 19
                    ],
                    elements: [
                        {
                            type:'PolygonMaterialElement',
                            points: [
                                {x:210, y:70},
                                {x:785, y:70},
                                {x:920, y:302},
                                {x:70, y:302}
                            ],
                            materialWidth: 600,
                            materialHeight: 600,
                            rotation:0,
                            renderStamps: true,
                            optionCode: 'boxColour'
                        },

                        {
                            type:'MaterialElement',
                            x: 71,
                            y: 300,
                            width: 848,
                            height: 116,
                            rotation:0,
                            optionCode: 'boxColour'
                        },

                        {
                            type:'PolygonMaterialElement',
                            materialWidth: 87,
                            materialHeight: 814,
                            points: [
                                {x:913, y:308},
                                {x:913, y:402},
                                {x:86, y:402},
                                {x:83, y:308},
                            ],
                            rotation:0,
                            optionCode: 'boxColour'
                        },

                        {
                            type:'PolygonMaterialElement',
                            materialWidth: 87,
                            materialHeight: 814,
                            points: [
                                {x:913, y:308},
                                {x:913, y:402},
                                {x:86, y:402},
                                {x:83, y:308},
                            ],
                            rotation:0,
                            optionCode: 'boxLinersWallsColour'
                        }
                    ]
                };

                //------------------ SLIP CASE ----------------------
                var slipCaseImagePlaceholder = PACE.StoreConfig.defaultMaterialUrl;//'https://irisstudio.s3.amazonaws.com/materials/cover-img-placeholder.png';

                var slipCaseSpecs = {
                    urlPrefix: 'images/cover-builder/sc-layer',
                    maskIndices: [1, 11],
                    size: {
                        width: 1000,
                        height: 1087,
                    },
                    stampRatio: 0.85,
                    padding: {
                        x: 277,
                        y: 100,
                        width: 632,
                        height: 840
                    },
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'multiply', opacity:1.0 },      //layer 3
                        { mode:'multiply', opacity:1.0 },      //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'multiply', opacity:1.0 },      //layer 6
                        { mode:'multiply', opacity:1.0 },      //layer 7
                        { mode:'multiply', opacity:1.0 },      //layer 8
                        { mode:'multiply', opacity:1.0 },      //layer 9
                        { mode:'source-over',   opacity:1.0 }, //layer 10
                        { mode:'multiply', opacity:1.0 },      //layer 11
                        { mode:'source-over',   opacity:1.0 }, //layer 12
                        { mode:'source-over',   opacity:1.0 }, //layer 13
                        { mode:'multiply', opacity:1.0 },      //layer 14
                        { mode:'source-over',   opacity:1.0 }, //layer 15
                        { mode:'source-over',   opacity:1.0 }, //layer 16
                        { mode:'multiply', opacity:1.0 },      //layer 17
                        { mode:'multiply', opacity:1.0 },      //layer 18
                        { mode:'multiply', opacity:1.0 },      //layer 19
                        { mode:'multiply', opacity:1.0 },      //layer 20
                        { mode:'source-over',   opacity:1.0 }, //layer 21
                        { mode:'source-over',   opacity:1.0 }  //layer 22
                    ],
                    elements: [
                        {
                            type:'MaterialElement',
                            x: 253,
                            y: 77,
                            width: 690,
                            height: 890,
                            rotation:0,
                            optionCode: 'boxColour',
                            renderStamps: true,
                            resize: true
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 129,
                            height: 884,
                            rotation:0,
                            optionCode: 'bookColour'
                        }
                    ]

                };

                //------------------ SLIP CASE for 1/4 IC ----------------------
                var slipCaseQbicSpecs = {
                    urlPrefix: 'images/cover-builder/sc-layer',
                    maskIndices: [1, 11],
                    size: {
                        width: 1000,
                        height: 1087,
                    },
                    stampRatio: 0.85,
                    padding: {
                        x: 277,
                        y: 100,
                        width: 632,
                        height: 840
                    },
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'multiply', opacity:1.0 },      //layer 3
                        { mode:'multiply', opacity:1.0 },      //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'multiply', opacity:1.0 },      //layer 6
                        { mode:'multiply', opacity:1.0 },      //layer 7
                        { mode:'multiply', opacity:1.0 },      //layer 8
                        { mode:'multiply', opacity:1.0 },      //layer 9
                        { mode:'source-over',   opacity:1.0 }, //layer 10
                        { mode:'multiply', opacity:1.0 },      //layer 11
                        { mode:'source-over',   opacity:1.0 }, //layer 12
                        { mode:'source-over',   opacity:1.0 }, //layer 13
                        { mode:'multiply', opacity:1.0 },      //layer 14
                        { mode:'source-over',   opacity:1.0 }, //layer 15
                        { mode:'source-over',   opacity:1.0 }, //layer 16
                        { mode:'multiply', opacity:1.0 },      //layer 17
                        { mode:'multiply', opacity:1.0 },      //layer 18
                        { mode:'multiply', opacity:1.0 },      //layer 19
                        { mode:'multiply', opacity:1.0 },      //layer 20
                        { mode:'source-over',   opacity:1.0 }, //layer 21
                        { mode:'source-over',   opacity:1.0 }  //layer 22
                    ],
                    elements: [
                        {
                            type:'MaterialElement',
                            x: 253,
                            y: 77,
                            width: 690,
                            height: 890,
                            rotation:0,
                            optionCode: 'boxColour',
                            renderStamps: true,
                            resize: true
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 129,
                            height: 884,
                            rotation:0,
                            materialUrl: slipCaseImagePlaceholder
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 120,
                            height: 884,
                            rotation:0,
                            optionCode: 'qbicColour'
                        },
                    ]

                };

                //------------------ SLIP CASE for FIC ----------------------
                var slipCaseFicSpecs = {
                    urlPrefix: 'images/cover-builder/sc-layer',
                    maskIndices: [1, 11],
                    size: {
                        width: 1000,
                        height: 1087,
                    },
                    stampRatio: 0.85,
                    padding: {
                        x: 277,
                        y: 100,
                        width: 632,
                        height: 840
                    },
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'multiply', opacity:1.0 },      //layer 3
                        { mode:'multiply', opacity:1.0 },      //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'multiply', opacity:1.0 },      //layer 6
                        { mode:'multiply', opacity:1.0 },      //layer 7
                        { mode:'multiply', opacity:1.0 },      //layer 8
                        { mode:'multiply', opacity:1.0 },      //layer 9
                        { mode:'source-over',   opacity:1.0 }, //layer 10
                        { mode:'multiply', opacity:1.0 },      //layer 11
                        { mode:'source-over',   opacity:1.0 }, //layer 12
                        { mode:'source-over',   opacity:1.0 }, //layer 13
                        { mode:'multiply', opacity:1.0 },      //layer 14
                        { mode:'source-over',   opacity:1.0 }, //layer 15
                        { mode:'source-over',   opacity:1.0 }, //layer 16
                        { mode:'multiply', opacity:1.0 },      //layer 17
                        { mode:'multiply', opacity:1.0 },      //layer 18
                        { mode:'multiply', opacity:1.0 },      //layer 19
                        { mode:'multiply', opacity:1.0 },      //layer 20
                        { mode:'source-over',   opacity:1.0 }, //layer 21
                        { mode:'source-over',   opacity:1.0 }  //layer 22
                    ],
                    elements: [
                        {
                            type:'MaterialElement',
                            x: 253,
                            y: 77,
                            width: 690,
                            height: 890,
                            rotation:0,
                            optionCode: 'boxColour',
                            renderStamps: true,
                            resize: true
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 129,
                            height: 884,
                            rotation:0,
                            materialUrl: slipCaseImagePlaceholder
                        },
                    ]

                };

                //------------------ SLIP CASE for pressbook ----------------------
                var slipCasePbSpecs = {
                    urlPrefix: 'images/cover-builder/sc-pb-layer',
                    maskIndices: [1, 12],
                    size: {
                        width: 1000,
                        height: 1087,
                    },
                    stampRatio: 0.85,
                    padding: {
                        x: 277,
                        y: 100,
                        width: 632,
                        height: 840
                    },
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'multiply',      opacity:1.0 }, //layer 3
                        { mode:'multiply',      opacity:1.0 }, //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'source-over',   opacity:1.0 }, //layer 6
                        { mode:'source-over',   opacity:1.0 }, //layer 7
                        { mode:'multiply',      opacity:1.0 }, //layer 8
                        { mode:'multiply',      opacity:1.0 }, //layer 9
                        { mode:'multiply',      opacity:1.0 }, //layer 10
                        { mode:'source-over',   opacity:1.0 }, //layer 11
                        { mode:'multiply',      opacity:1.0 }, //layer 12
                        { mode:'source-over',   opacity:1.0 }, //layer 13
                        { mode:'source-over',   opacity:1.0 }, //layer 14
                        { mode:'multiply',      opacity:1.0 }, //layer 15
                        { mode:'source-over',   opacity:1.0 }, //layer 16
                        { mode:'source-over',   opacity:1.0 }, //layer 17
                        { mode:'multiply',      opacity:1.0 }, //layer 18
                        { mode:'multiply',      opacity:1.0 }, //layer 19
                        { mode:'multiply',      opacity:1.0 }, //layer 20
                        { mode:'multiply',      opacity:1.0 }, //layer 21
                        { mode:'source-over',   opacity:1.0 }, //layer 22
                        { mode:'source-over',   opacity:1.0 }  //layer 23
                    ],
                    elements: [
                        {
                            type:'MaterialElement',
                            x: 253,
                            y: 77,
                            width: 690,
                            height: 890,
                            rotation:0,
                            optionCode: 'boxColour',
                            renderStamps: true,
                            resize: true
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 129,
                            height: 884,
                            rotation:0,
                            optionCode: 'bookColour'
                        }
                    ]
                };


                //------------------ SLIP CASE for pressbook and 1/4 IC ----------------------
                var slipCasePbQbicSpecs = {
                    urlPrefix: 'images/cover-builder/sc-pb-layer',
                    maskIndices: [1, 12],
                    size: {
                        width: 1000,
                        height: 1087,
                    },
                    stampRatio: 0.85,
                    padding: {
                        x: 277,
                        y: 100,
                        width: 632,
                        height: 840
                    },
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'multiply',      opacity:1.0 }, //layer 3
                        { mode:'multiply',      opacity:1.0 }, //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'source-over',   opacity:1.0 }, //layer 6
                        { mode:'source-over',   opacity:1.0 }, //layer 7
                        { mode:'multiply',      opacity:1.0 }, //layer 8
                        { mode:'multiply',      opacity:1.0 }, //layer 9
                        { mode:'multiply',      opacity:1.0 }, //layer 10
                        { mode:'source-over',   opacity:1.0 }, //layer 11
                        { mode:'multiply',      opacity:1.0 }, //layer 12
                        { mode:'source-over',   opacity:1.0 }, //layer 13
                        { mode:'source-over',   opacity:1.0 }, //layer 14
                        { mode:'multiply',      opacity:1.0 }, //layer 15
                        { mode:'source-over',   opacity:1.0 }, //layer 16
                        { mode:'source-over',   opacity:1.0 }, //layer 17
                        { mode:'multiply',      opacity:1.0 }, //layer 18
                        { mode:'multiply',      opacity:1.0 }, //layer 19
                        { mode:'multiply',      opacity:1.0 }, //layer 20
                        { mode:'multiply',      opacity:1.0 }, //layer 21
                        { mode:'source-over',   opacity:1.0 }, //layer 22
                        { mode:'source-over',   opacity:1.0 }  //layer 23
                    ],
                    elements: [
                        {
                            type:'MaterialElement',
                            x: 253,
                            y: 77,
                            width: 690,
                            height: 890,
                            rotation:0,
                            optionCode: 'boxColour',
                            renderStamps: true,
                            resize: true
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 129,
                            height: 884,
                            rotation:0,
                            materialUrl: slipCaseImagePlaceholder,
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 100,
                            height: 884,
                            rotation:0,
                            optionCode: 'qbicColour'
                        },

                    ]
                };

                //------------------ SLIP CASE for pressbook and FIC ----------------------
                var slipCasePbFicSpecs = {
                    urlPrefix: 'images/cover-builder/sc-pb-layer',
                    maskIndices: [1, 12],
                    size: {
                        width: 1000,
                        height: 1087,
                    },
                    stampRatio: 0.85,
                    padding: {
                        x: 277,
                        y: 100,
                        width: 632,
                        height: 840
                    },
                    layers: [
                        { mode:'source-over',   opacity:1.0 }, //layer 1
                        { mode:'source-over',   opacity:1.0 }, //layer 2
                        { mode:'multiply',      opacity:1.0 }, //layer 3
                        { mode:'multiply',      opacity:1.0 }, //layer 4
                        { mode:'source-over',   opacity:1.0 }, //layer 5
                        { mode:'source-over',   opacity:1.0 }, //layer 6
                        { mode:'source-over',   opacity:1.0 }, //layer 7
                        { mode:'multiply',      opacity:1.0 }, //layer 8
                        { mode:'multiply',      opacity:1.0 }, //layer 9
                        { mode:'multiply',      opacity:1.0 }, //layer 10
                        { mode:'source-over',   opacity:1.0 }, //layer 11
                        { mode:'multiply',      opacity:1.0 }, //layer 12
                        { mode:'source-over',   opacity:1.0 }, //layer 13
                        { mode:'source-over',   opacity:1.0 }, //layer 14
                        { mode:'multiply',      opacity:1.0 }, //layer 15
                        { mode:'source-over',   opacity:1.0 }, //layer 16
                        { mode:'source-over',   opacity:1.0 }, //layer 17
                        { mode:'multiply',      opacity:1.0 }, //layer 18
                        { mode:'multiply',      opacity:1.0 }, //layer 19
                        { mode:'multiply',      opacity:1.0 }, //layer 20
                        { mode:'multiply',      opacity:1.0 }, //layer 21
                        { mode:'source-over',   opacity:1.0 }, //layer 22
                        { mode:'source-over',   opacity:1.0 }  //layer 23
                    ],
                    elements: [
                        {
                            type:'MaterialElement',
                            x: 253,
                            y: 77,
                            width: 690,
                            height: 890,
                            rotation:0,
                            optionCode: 'boxColour',
                            renderStamps: true,
                            resize: true
                        },
                        {
                            type:'MaterialElement',
                            x: 131,
                            y: 84,
                            width: 129,
                            height: 884,
                            rotation:0,
                            materialUrl: slipCaseImagePlaceholder
                        },

                    ]
                };

                //------------------ FM end papers ----------------------
                var endPapersSpecs = {
                    urlPrefix: 'images/cover-builder/fm-open-layer',
                    maskIndices: [1, 6, 10, 14],
                    size: {
                        width: 1000,
                        height: 607,
                    },
                    layers: [
                        { mode:'source-over', opacity:1.0 }, //layer 1
                        { mode:'source-over', opacity:1.0 }, //layer 2
                        { mode:'source-over', opacity:1.0 }, //layer 3
                        { mode:'multiply',    opacity:1.0 }, //layer 4
                        { mode:'source-over', opacity:1.0 }, //layer 5
                        { mode:'multiply',    opacity:1.0 }, //layer 6
                        { mode:'source-over', opacity:1.0 }, //layer 7
                        { mode:'multiply',    opacity:1.0 }, //layer 8
                        { mode:'source-over', opacity:1.0 }, //layer 9
                        { mode:'source-over', opacity:1.0 }, //layer 10
                        { mode:'source-over', opacity:1.0 }, //layer 11
                        { mode:'multiply',    opacity:1.0 }, //layer 12
                        { mode:'source-over', opacity:1.0 }, //layer 13
                        { mode:'source-over', opacity:1.0 }, //layer 14
                        { mode:'source-over', opacity:1.0 }, //layer 15
                        { mode:'source-over', opacity:1.0 }, //layer 16
                        { mode:'multiply',    opacity:0.4, dark: {mode:'color-burn', opacity:0.5} }, //layer 17

                    ],
                    elements: [
                        //default material to show when book material is FIC
                        {
                            type:'MaterialElement',
                            x: 25,
                            y: 5,
                            width: 946,
                            height: 578,
                            rotation:0,
                        },
                        {
                            type:'MaterialElement',
                            x: 25,
                            y: 5,
                            width: 946,
                            height: 578,
                            rotation:0,
                            optionCode: 'bookColour'
                        },
                        {
                            type:'MaterialElement',
                            x: 34,
                            y: 33,
                            width: 928,
                            height: 536,
                            rotation:0,
                            optionCode: 'endPapersColour',
                            checkDark: true,
                            fillWithMaterial: true
                        }
                    ]
                };

                var boxTypes = {
                    'clam_shell': clamShellSpecs,
                    'presentation_box': presBoxSpecs,
                    'slip_case': slipCaseSpecs,
                    'slip_case_pb': slipCasePbSpecs,
                    'slip_case_qbic': slipCaseQbicSpecs,
                    'slip_case_fic': slipCaseFicSpecs,
                    'slip_case_pb_qbic': slipCasePbQbicSpecs,
                    'slip_case_pb_fic': slipCasePbFicSpecs,
                    'end_papers': endPapersSpecs
                };

                var coverShapeInfo,
                    layers = [],
                    numLayersLoaded = 0,
                    layersLoaded = false,
                    boxType,
                    loadingStuff = false;


                function autoScale() {
                    if (layers.length===0) return;

                    var canvasSize = mainRenderer.getCanvasSize(1.0),
                        size = { width:$canvasWrap.width(), height:$canvasWrap.height() },
                        rect = GeomService.fitRectangleProportionally( canvasSize, size );

                    var currentBoxType = $scope.product.options.boxType;
                    if (!endPapersMode && ['clam_shell', 'presentation_box'].indexOf(currentBoxType)>=0) {
                        var coverRect = GeomService.fitRectangleProportionally( $scope.coverLayout.layoutSize, size ),
                        rect = GeomService.fitRectangleProportionally( canvasSize, { width: coverRect.width * 1.3, height: coverRect.height * 1.3 } );
                    }

                    var scale = Math.min(1.6, rect.width / canvasSize.width);

                    _.each(layoutController.renderers, function(r) {
                        r.scale = r.canvas.scale = scale;
                    });
                    layoutController.scale = scale;
                    materialsRenderer.render();
                    mainRenderer.render();

                    $scope.marginTop = -Math.round(canvasSize.height * scale / 2) + 'px';

                    setTimeout(function() { mainRenderer.canvas.calcOffset() });
                }

                function prepareLayout() {
                    var currentBoxType = $scope.product.options.boxType;

                    if (endPapersMode) {
                        currentBoxType = 'end_papers';
                        if ($scope.params) {
                            if ($scope.params.coverMaterialOption) {
                                endPapersSpecs.elements[1].optionCode = $scope.params.coverMaterialOption;
                            }
                            if ($scope.params.endPapersOption) {
                                endPapersSpecs.elements[2].optionCode = $scope.params.endPapersOption;
                            }
                        }

                    } else {
                        if ($scope.product.options.boxType==='slip_case' && $scope.productPrototype.code.indexOf('fm_')===-1)
                            currentBoxType = 'slip_case_pb';

                        if ($scope.product.options.boxType==='slip_case' &&
                            ['qbic', 'fic'].indexOf($scope.product.options.bookMaterial)>=0) {
                            currentBoxType += '_' + $scope.product.options.bookMaterial;
                        }
                    }

                    if (!currentBoxType) {
                        $scope.layout = $scope.mainLayout = {
                            spreads:[ { elements:[], numPages:1, pageNumber:0 } ],
                            layoutSize: { width:0, height:0 }
                        };
                        layers = [];
                        numLayersLoaded = 0;
                        layersLoaded = false;
                        return;
                    }

                    if (currentBoxType===boxType) return;

                    boxType = currentBoxType;
                    coverShapeInfo = boxTypes[boxType];

                    var width = coverShapeInfo.size.width,
                        height = coverShapeInfo.size.height,
                        boxSizeRatio = 1.0;

                    if (boxType.indexOf('slip_case')===0) {
                        boxSizeRatio = (slipCaseSpecs.elements[0].height / slipCaseSpecs.elements[0].width) *
                            $scope.coverLayout.layoutSize.width / $scope.coverLayout.layoutSize.height;

                        width *= boxSizeRatio;
                    }

                    //set up layouts
                    var spread = {
                            numPages: 1,
                            pageNumber: 0,
                            elements: []
                        },
                        layoutSize = {
                            width: width,
                            height: height,
                            pageOrientation: 'Horizontal'
                        },
                        layout = {
                            spreads: [spread],
                            layoutSize: layoutSize
                        },
                        mainLayout = {
                            spreads: [{ numPages: 1, pageNumber: 0, elements: [] }],
                            layoutSize: layoutSize
                        };

                    _.each(coverShapeInfo.elements, function(el) {
                        var element = angular.copy(el);

                        element.width *= boxSizeRatio;
                        element.x *= boxSizeRatio;

                        if (element.optionCode) {
                            element.prototypeProductOption = $scope.productPrototype.getPrototypeProductOption(element.optionCode);
                        }
                        if (element.renderStamps) {
                            var w = element.materialWidth || element.width;
                            element.stampScale = (w / $scope.coverLayout.layoutSize.width) * coverShapeInfo.stampRatio;
                        }

                        spread.elements.push(element);
                    });

                    materialRendererScope.layout = layout;
                    materialRendererScope.spread = layout.spreads[0];
                    materialsRenderer.makePages();

                    mainRendererScope.layout = mainLayout;
                    mainRendererScope.spread = mainLayout.spreads[0];
                    mainRenderer.makePages();

                    //load layers
                    layers = [];
                    numLayersLoaded = 0;
                    layersLoaded = false;

                    var onLoad = function() {
                        numLayersLoaded++;
                        if (numLayersLoaded===coverShapeInfo.layers.length) {
                            layersLoaded = true;
                            materialsRenderer.render();
                        }
                    };

                    for(var i=0;i<coverShapeInfo.layers.length;i++) {
                        var layer = new Image();
                        layer.onload = onLoad;
                        layer.src = coverShapeInfo.urlPrefix + (i+1) + '.png';
                        layers.push(layer);
                    }
                    setTimeout(function() {
                        if (!layersLoaded) {
                            spinner.show();
                        }
                    }, 500);
                    renderFirstTime = true;
                    loadingStuff = true;
                }

                function getNumObjectsReady() {
                    var numObjectsReady = 0;

                    angular.forEach(materialsRenderer.canvas.getObjects(), function(object) {
                        if (object.type==='ImageStampElement' || object.type==='MaterialElement' || object.type==='PolygonMaterialElement')
                            numObjectsReady += (object.loaded ? 1 : 0);
                        else
                            numObjectsReady++;
                    });
                    return numObjectsReady;
                }

                var resizeHandler = $debounce(autoScale, 500);
                $window.resize(resizeHandler);
                spinner.hide();

                $scope.$on('$destroy', function() {
                    $window.unbind('resize', resizeHandler);
                });

                $scope.$watch('product.options.boxType', function(val, oldVal) {
                    if (val===oldVal) return;
                    BumpMapService.lastBoxImage = null;
                    prepareLayout();
                    autoScale();
                });

                $scope.layoutController.refreshCoverPreview = function() {
                    if (layers.length===0) return;
                    materialsRenderer.render();
                };

                var currentAnimation;

                var transitionDebounced = $debounce(function() {
                    var materials = [],
                        numMaterialsLoaded = 0;

                    _.each(materialsRenderer.canvas.getObjects(), function(object) {
                        if ((object.type==='MaterialElement' || object.type==='PolygonMaterialElement') && object.prevImage) {
                            materials.push(object);

                            if (object.loaded) numMaterialsLoaded++;
                        }
                    });

                    if (materials.length>numMaterialsLoaded) return;

                    var animation = {};
                    if (currentAnimation) {
                        currentAnimation.cancelled = true;
                    }
                    currentAnimation = animation;

                    fabric.util.animate({
                        startValue: 0,
                        endValue: 1,
                        duration: 500,
                        onChange: function(value) {
                            _.each(materials, function(m) {
                                m.transition = value;
                            });

                            materialsRenderer.canvas.renderAll();
                        },
                        onComplete: function() {
                             _.each(materials, function(m) {
                                //m.prevImage = null;
                            });
                            currentAnimation = null;
                        },
                        abort: function() {
                            return animation.cancelled;
                        }
                    });

                }, 0);

                materialsRenderer.canvas.on('material:loaded', function() {
                    transitionDebounced();
                });

                materialsRenderer.canvas.on('after:render', function() {
                    if (layers.length===0) return;

                    var numObjectsReady = getNumObjectsReady();
                    if (numObjectsReady>0 && numObjectsReady===materialsRenderer.canvas.size()) {
                        mainRenderer.render();
                    } else {
                        loadingStuff = true;
                        setTimeout(function() {
                            if (loadingStuff) spinner.show();
                        }, 500)

                    }
                });

                var renderFirstTime = true,
                    tmpCanvas;

                mainRenderer.canvas.on('before:render', function() {
                    if (layers.length===0) return;

                    var ctx = mainRenderer.canvas.getContext(),
                        width = mainRenderer.canvas.width,
                        height = mainRenderer.canvas.height,
                        numObjectsReady = getNumObjectsReady(),
                        isDark = false;

                    if (!layersLoaded || numObjectsReady<materialsRenderer.canvas.size()) {
                        if (!currentAnimation && BumpMapService.lastBoxImage) {
                            ctx.putImageData(BumpMapService.lastBoxImage, 0, 0);
                        }
                        return;
                    }
                    loadingStuff = false;
                    spinner.hide();

                    _.each(materialsRenderer.canvas.getObjects(), function(object) {
                        if ((object.type==='MaterialElement' || object.type==='PolygonMaterialElement') && object.element.checkDark &&
                            object.element.prototypeProductOption) {
                            var optionCode = object.element.prototypeProductOption.effectiveCode,
                                optionValueCode = object.product.options[optionCode],
                                optionValue = object.productPrototype.getPrototypeProductOptionValue(optionCode, optionValueCode);

                            if (optionValue && optionValue.productOptionValue.params && optionValue.productOptionValue.params.dark) {
                                isDark = true;
                            }
                        }
                    });

                    tmpCanvas = tmpCanvas || document.createElement("canvas");
                    if (tmpCanvas.width!==width || tmpCanvas.height!==height) {
                        tmpCanvas.width = width;
                        tmpCanvas.height = height;
                    }
                    var tmpCtx = tmpCanvas.getContext("2d");

                    ctx.globalCompositeOperation = 'source-over';
                    ctx.clearRect(0,0, width, height);

                    //mask the texture
                    var mask = layers[coverShapeInfo.maskLayerIndex],
                        pad = coverShapeInfo.padding,
                        maskIndices = coverShapeInfo.maskIndices;

                    //draw layers
                    for(var i=0;i<coverShapeInfo.layers.length;i++) {
                        var layerInfo = coverShapeInfo.layers[i];
                        if (isDark && layerInfo.dark) {
                            layerInfo = layerInfo.dark;
                        }
                        ctx.globalCompositeOperation = layerInfo.mode;
                        ctx.globalAlpha = layerInfo.opacity;

                        if (maskIndices.indexOf(i)>=0) {
                            mask = layers[i];

                            tmpCtx.globalCompositeOperation = 'source-over';
                            tmpCtx.clearRect(0, 0, width, height);
                            tmpCtx.drawImage(mask, 0, 0, width, height);

                            tmpCtx.globalCompositeOperation = 'source-atop';
                            tmpCtx.drawImage(materialsRenderer.canvas.getElement(), 0, 0, width, height);

                            ctx.drawImage(tmpCanvas, 0, 0, width, height);
                        } else {
                            ctx.drawImage(layers[i], 0, 0, width, height);
                        }
                    }

                    if (renderFirstTime && !BumpMapService.lastBoxImage) {
                        renderFirstTime = false;
                        $element.fadeOut(0).fadeIn();
                    }

                    if (!currentAnimation) {
                        try {
                            BumpMapService.lastBoxImage = ctx.getImageData(0, 0, width, height);
                        } catch(error) {
                            console.log('Cannot store lastCoverImage');
                        }
                    }

                });

                prepareLayout();
                autoScale();
            }
        };
    }]);
