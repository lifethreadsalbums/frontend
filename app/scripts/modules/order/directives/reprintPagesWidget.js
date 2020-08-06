'use strict';

angular.module('pace.order')

.directive('reprintPagesWidget', ['$debounce', '$timeout', function($debounce, $timeout) {
        return {
            restrict: 'A',
            priority: 1,
            require: 'ngModel',
            link: function postLink(scope, element, attrs, ngModelCtrl) {

                var defaultEvents = ["keydown", "input", "change"];
                element.addClass('reprint-pages-widget');

                angular.forEach(defaultEvents, function (event) {
                    try { element.off(event); } catch (e) { }
                });

                var formatPagesDebounced = $debounce(formatPages, 500);

                element.on(defaultEvents.join(" "), function (e) {
                    formatPagesDebounced();
                });

                // element.on('keyup', function() {
                //     formatPagesDebounced();
                // });
                
                

                element.on('blur', function() {
                    formatPages();
                });

                function formatPages() {
                    
                    var pages = parsePageNumbers();
                    if (!pages || pages.length==0)
                    {
                        element.val('');
                        ngModelCtrl.$setViewValue('');
                        return;
                    }
                    
                    pages.sort(function(a,b) { return a - b; });
                    
                    var n = pages.length;
                    var last = pages[0];
                    var currentRangeFrom = pages[0];
                    var ranges = [];
                    for(var i=1;i<n;i++)
                    {
                        if (pages[i] - last>1)
                        {
                            if (last>currentRangeFrom)
                                ranges.push(currentRangeFrom + "-" + last);
                            else
                                ranges.push(currentRangeFrom);
                            currentRangeFrom = pages[i];
                        }  
                        last = pages[i];
                    }
                    if (last>currentRangeFrom)
                        ranges.push(currentRangeFrom + "-" + last);
                    else
                        ranges.push(currentRangeFrom);
                    
                    //element.val(ranges.join(",") + ",");

                    
                    var value = ranges.join(",") + ",";
                    element.val(value);
                    ngModelCtrl.$setViewValue(value);

                    scope.model.product.options._reprintPageCount = n;
                }

                function parsePageNumbers() {
                    var isPageBased = scope.model.productPrototype.productPageType==='PageBased';
                    var isRPS = false;
                    var numPages = scope.model.product.options._pageCount;
                    // if (form.order.jobType==JobType.REPRINT)
                    // {
                    //     var originalJobProduct:Product = bookDetails.getProduct()
                    //     if (originalJobProduct && originalJobProduct.configuration.pageType==PageType.SPREAD)
                    //     {
                    //         isPageBased = false;
                    //         numPages = form.order.pageCount/2;
                    //     }
                    // }
                    
                    var pages = element.val();
                    
                    if (pages && pages.toLowerCase().indexOf("all")>=0)
                    {
                        if (isRPS && !isPageBased)
                            pages = "0.5-" + (numPages-0.5);
                        else
                            pages =  "1-" + numPages;
                    }
                    
                    if (!pages || pages=="")
                        return null;
                    
                    
                    var result = [];
                    var regexp = /(\d+\-\d+)|(\d+)/g;
                    if (isRPS && !isPageBased)
                    {
                        regexp = /([0-9]+\.?[0-9]*\-[0-9]*\.?[0-9]+)|([0-9]+\.?[0-9]*)/g;
                    }
                    var matches = pages.match(regexp);
                    for(var k=0;k<matches.length;k++) {
                        var grp = matches[k];
                        if (grp.indexOf("-")>0)
                        {
                            var range = grp.split("-");
                            var from = parseFloat(range[0]);
                            var to = parseFloat(range[1]);
                            
                            if (!isPageBased && isRPS)
                            {
                                if (from==0 || (from>0 && from<1))
                                    from = 0.5;
                                else
                                    from = Math.floor(from);
                                
                                if (to>numPages - 1 && to<numPages)
                                    to = numPages - 0.5;
                                else
                                    to = Math.floor(to);
                            } else {
                                if (from==0)
                                    from = 1;
                            }
                            
                            if (to==from)
                            {
                                if (isPageBased && to%2==0)
                                    to--;
                                if (result.indexOf(to)==-1 && to<numPages)
                                {
                                    result.push(to);
                                    if (isPageBased)
                                        result.push(to+1);
                                }
                            } else if (to<from)
                                continue;
                            if (isPageBased && from%2==0)
                                from--;
                            
                            if (from==0.5)
                            {
                                result.push(from);
                                from = 1;
                            }
                            if (to==numPages-0.5)
                                result.push(to);
                            
                            for(var i=from;i<=to;i+= isPageBased ? 2 : 1)
                            {
                                if (result.indexOf(i)==-1 && i<=numPages)
                                {
                                    result.push(i);
                                    if (isPageBased)
                                        result.push(i+1);
                                }
                            }
                            
                        } else {
                            var num = parseFloat(grp);
                            
                            if (!isPageBased && isRPS)
                            {
                                if (num==0 || (num>0 && num<1))
                                    num = 0.5;
                                else if (num>numPages - 1 && num<numPages)
                                    num = numPages - 0.5;
                                else
                                    num = Math.floor(num);
                            } else {
                                if (num==0)
                                    num = 1;
                            }
                            if (isPageBased && num%2==0)
                                num--;
                            if (result.indexOf(num)==-1 && num<numPages)
                            {
                                result.push(num);
                                if (isPageBased)
                                    result.push(num+1);
                            }
                        }
                    }
                    return result;
                }
        
                
                
            }
        };  
    }
]);
