'use strict';

angular.module('pace.layout')
    .controller('UiCtrl', ['$scope', '$rootScope', 'MessageService', function ($scope, $rootScope, MessageService) {

        // MessageService.ask('This is an example test popup. Do you understand?', 'info', [
        //     { label: 'Yes'},
        //     { label: 'No' }
        // ]);

        // MessageService.show('This is an example test popup.', 'alert');

        $scope.selectedItem1 = 2;
        $scope.selectedItem2 = 4;
        $scope.selectedOption = 'option3';
        
        $scope.items = [
            { id:1, name:'Item 1'},
            { id:2, name:'Item 2'},
            { id:3, name:'Item 3'},
            { id:4, name:'Item 4'},
        ];

        $scope.options = [
            {value: 'option1', label: 'Option 1'},
            {value: 'option2', label: 'Option 2'},
            {value: 'option3', label: 'Option 3'},
            {value: 'option4', label: 'Option 4'},
            {value: 'option5', label: 'Option 5'},
        ];

    }])

    .controller('TemplateImportCtrl', ['$scope', '$rootScope', 'layoutSizes', 'users', 'LayoutTemplate', 'SpreadToTemplateService', 'QueueRequestService', 'AppConstants',
        function ($scope, $rootScope, layoutSizes, users, LayoutTemplate, SpreadToTemplateService, QueueRequestService, AppConstants) {

        var templates = _.filter(PACE.UserTemplates, function(t) {
            return t.is_public===0 && t.username==='shootme@getzcreative.com';
        });

        function getLayoutSize(shape) {
            return _.findWhere(layoutSizes, {code:shape});
        }

        function getUser(email) {
            return _.findWhere(users, {email:email});
        }

        function getElement(f, page) {
            var pageRect = page.getPageRect();

            return { 
                type: 'ImageElement', 
                x: f.x + pageRect.x,
                y: f.y,
                width: f.w,
                height: f.h,
                rotation: 0,
                opacity: 1,
                imageX: 0,
                imageY: 0,
                imageWidth: 1,
                imageHeight: 1,
                imageRotation: 0,
                imageFile: {
                    width: 1,
                    height: 1,
                }
            };
        }

        function importTemplate(t, i) {
            
            console.log('importing template '+i+' of ' + templates.length);

            var shape = t.shape_code.replace('-LF', '');

            var layoutSize = getLayoutSize(shape),
                user = getUser(t.username);

            if (!layoutSize) {
                console.warn('No layoutSize for template', t);
                return;
            }

            if (!user) {
                console.warn('No user for template', t);
                return;
            }

            if (t.shape_code.indexOf('-LF')>0) {
                layoutSize = angular.copy(layoutSize);
                layoutSize.width -= AppConstants.LF_HIDDEN_AREA;
            }

            var spread = { numPages: 2, elements: [] },
                layout = { layoutSize: layoutSize };


            var pages = new PACE.SpreadInfoFactory().create(spread, layout).pages;                    
            var frames = JSON.parse(t.pattern);

            if (t.is_spread_template===0) {
                frames = [ frames ];
            }


            _.each(frames, function(framePages, pageIndex) {

                var page = pages[pageIndex],
                    pageElements = [];

                _.each(framePages, function(f) {

                    var el = getElement(f, page)
                    pageElements.push(el);
                    spread.elements.push(el);

                });

                if (t.fixed_spacing!==-1) {
                    console.log('Applying fixed spacing', t.fixed_spacing);
                    new PACE.FixedSpacingCommand2(pageElements, t.fixed_spacing * 72).execute();

                }

            });
                
            var template = SpreadToTemplateService.getTemplate(
                spread, layout, 'spread');
            
            // if (template.left && template.left.type==='CustomLayoutTemplate' || 
            //     template.right && template.right.type==='CustomLayoutTemplate') {
            //     return;
            // }

            var lt = new LayoutTemplate.newLayoutTemplate(template);
            QueueRequestService.push('save-layout-template', function () {
                console.log('Saving template id=' + t.frame_template_id, t.username, spread, template);
                return lt.$importTemplate({email:t.username});
            });
            QueueRequestService.run('save-layout-template');
        }

        $scope.import = function() {

            _.each(templates, importTemplate);

        };

    }]);