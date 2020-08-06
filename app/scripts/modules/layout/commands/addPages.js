(function() {
    "use strict";

    /* jshint loopfunc:true */
    var spreadInfoFactory = new PACE.SpreadInfoFactory();

    function toPages(layout) {
        var pages = [], pageIndex = 0;
        
        angular.forEach(layout.spreads, function(spread) {
            var spreadPages = spreadInfoFactory.create(spread, layout).pages;
 
            angular.forEach(spreadPages, function(page) {
                var rect = page.getBleedRect(),
                    elements = angular.copy(page.getElements());
                angular.forEach(elements, function(el) {
                    el.x -= rect.x;
                    el.y -= rect.y;
                });
                page.index = pageIndex++;
                page.elements = elements;
                pages.push(page);
            });
            
        });

        return pages;
    }

    function toSpreads(pages, layout) {
        var lps = layout.lps,
            pageIndex = 0,
            numSpreads = Math.floor(pages.length / 2) + (lps ? 0 : 1);

        if (numSpreads<layout.spreads.length) {
            var numDel = layout.spreads.length - numSpreads;
            layout.spreads.splice(layout.spreads.length - numDel - 1, numDel);
        }
        for (var i = 0; i < numSpreads; i++) {
            if (i>=layout.spreads.length)
                layout.spreads.push({});
            var spread = layout.spreads[i];

            spread.numPages = (!lps && (i===0 || i===numSpreads-1)) ? 1 : 2;
            spread.pageNumber = pageIndex + 1;

            var newPages = spreadInfoFactory.create(spread, layout).pages;

            spread.elements = [];
            
            for (var j = 0; j < spread.numPages; j++) {
                var rect = newPages[j].getBleedRect(),
                    elements = pages[pageIndex].elements;

                angular.forEach(elements, function(el) {
                    el.x += rect.x;
                    el.y += rect.y;
                    delete el.id;
                    delete el.version;
                    spread.elements.push(el);
                });
                pageIndex++;
            }
        }
    }

    PACE.SwapPagesCommand = function(layout, pageIndices) {

        var savedPages;

        this.execute = function() {
            var pages = toPages(layout);
                
            savedPages = angular.copy(pages);

            var page1 = pages[pageIndices[0]],
                page2 = pages[pageIndices[1]];
            pages[pageIndices[0]] = page2;
            pages[pageIndices[1]] = page1;
            toSpreads(pages, layout);
        };

        this.undo = function() {
            toSpreads(savedPages, layout);
        };

    }

    PACE.DeletePagesCommand = function(layout, pageIndices, minPages) {

        var savedPages;

        this.execute = function() {
            var pages = toPages(layout),
                pagesToBeDeleted = [],
                i, idx;

            savedPages = angular.copy(pages);
            
            for (i = 0; i < pageIndices.length; i++) {
                idx = pageIndices[i];
                pagesToBeDeleted.push(pages[idx]);
            }
            for (i = 0; i < pagesToBeDeleted.length; i++) {
                idx = pages.indexOf(pagesToBeDeleted[i]);
                pages.splice(idx, 1);
            }
            if (pages.length<minPages) {
                var numPages = minPages - pages.length;
                for (var i = 0; i < numPages; i++) {
                    pages.push({ elements:[] });
                }
            }

            toSpreads(pages, layout);
        };

        this.undo = function() {
            toSpreads(savedPages, layout);
        };
    };


    PACE.MovePagesCommand = function(layout, pageIndices, targetIndex) {
        
        var savedPages;

        this.execute = function() {
            var pages = toPages(layout),
                pagesToBeMoved = [],
                i, idx;

            savedPages = angular.copy(pages);
            for (i = 0; i < pageIndices.length; i++) {
                idx = pageIndices[i];
                pagesToBeMoved.push(pages[idx]);
            }
            for (i = 0; i < pagesToBeMoved.length; i++) {
                idx = pages.indexOf(pagesToBeMoved[i]);
                pages.splice(idx, 1);
                if (targetIndex>idx)
                    targetIndex--;
            }

            for (i = 0; i < pagesToBeMoved.length; i++) {
                pages.splice(targetIndex + i, 0, pagesToBeMoved[i]);
            }
            toSpreads(pages, layout);
        };

        this.undo = function() {
            toSpreads(savedPages, layout);
        };
    };

    PACE.AddPagesCommand = function(layout, numPages, pageLocation, pageNumber) {
        
        var savedPages;
        
        this.execute = function() {
            var pages = toPages(layout),
                index;

            savedPages = angular.copy(pages);
            /* jshint indent: false */
            switch(pageLocation) {
                case 0: //after page
                    index = Math.max(0, pageNumber );
                    break;
                case 1: //before page
                    index = Math.max(0, pageNumber - 1);
                    break;
                case 2: //at start of book
                    index = 0;
                    break;
                case 3: //at end of book
                    index = pages.length;
                    break;
            }
            for (var i = 0; i < numPages; i++) {
                pages.splice(index + i, 0, { elements:[] });
            }

            toSpreads(pages, layout);
        };

        this.undo = function() {
            toSpreads(savedPages, layout);
        };

    };

}());
