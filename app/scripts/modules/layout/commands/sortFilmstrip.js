PACE.SortFilmstripCommand = function(filmStripItems, mode) {
    'use strict';

    var isDigit = function(obj) {
        return !isNaN(parseInt(obj));
    };

    /**
     * The Alphanum Algorithm is an improved sorting algorithm for strings
     * containing numbers.  Instead of sorting numbers in ASCII order like
     * a standard sort, this algorithm sorts numbers in numeric order.
     *
     * The Alphanum Algorithm is discussed at http://www.DaveKoelle.com
     */
    var alphaNumericCompare = function(s1, s2) {
        var getChunk = function(s, slength, marker) {
            var result = '',
                c = s[marker];

            result += c;
            marker += 1;

            if(isDigit(c)) {
                while(marker < slength) {
                    c = s[marker];
                    if(!isDigit(c)) {
                        break;
                    }
                    result += c;
                    marker += 1;
                }
            } else {
                while(marker < slength) {
                    c = s[marker];
                    if(isDigit(c)) {
                        break;
                    }
                    result += c;
                    marker += 1;
                }
            }

            return result;
        };

        var s1Length = s1.length,
            s2Length = s2.length,
            s1Marker = 0,
            s2Marker = 0;

        while(s1Marker < s1Length && s2Marker < s2Length) {
            var s1Chunk = getChunk(s1, s1Length, s1Marker),
                s2Chunk = getChunk(s2, s2Length, s2Marker),
                result = 0;

            s1Marker += s1Chunk.length;
            s2Marker += s2Chunk.length;

            // If both chunks contain numeric characters, sort them numerically
            if(isDigit(s1Chunk[0]) && isDigit(s2Chunk[0])) {
                var s1Num = parseInt(s1Chunk),
                    s2Num = parseInt(s2Chunk);

                if(s1Num < s2Num) result = -1;
                else if(s1Num > s2Num) result = 1;
                else result = 0;

                if(result != 0) {
                    return result;
                }
            } else {
                if(s1Chunk < s2Chunk) result = -1;
                else if(s1Chunk > s2Chunk) result = 1;
                else result = 0;

                if(result != 0) {
                    return result;
                }
            }
        }

        return s1Length - s2Length;
    };

    function alphaSort(a,b) { 
        return alphaNumericCompare(a.image.filename.toLowerCase(), 
            b.image.filename.toLowerCase()); 
    }

    function sortBy(field) {
        return function(a,b) {
            var va = a.image[field],
                vb = b.image[field];
            return (va<vb ? -1 : (va>vb ? 1 : 0));
        };
    }

    function customSort(a, b) {
        var aOrd = isDigit(a.currentOrder) ? a.currentOrder : -1,
            bOrd = isDigit(b.currentOrder) ? b.currentOrder : -1;
        return aOrd - bOrd;
    }

    function spreadIndex(item) {
        if (item.occurrences && item.occurrences.length>0) {
            var o = item.occurrences[0];
            return o.spreadIndex;
        } 
        return Number.MAX_VALUE;
    }

    function elementSize(item) {
        if (item.occurrences && item.occurrences.length>0) {
            var o = item.occurrences[0],
                el = o.element;
            return el.height * 10000 + el.width;;
        } 
        return Number.MAX_VALUE;
    }

    function spreadSort(a, b) {
        return spreadIndex(a) - spreadIndex(b);
    }

    function elementSizeSort(a, b) {
        return elementSize(a) - elementSize(b);
    }


    var sortFn = {
        'alphabetical': alphaSort,
        'capture-time': sortBy('creationDate'),
        'upload-order': sortBy('id'),
        'star-rating': sortBy('rating'),
        'custom': customSort,
        'admin': spreadSort,
        'bySize': elementSizeSort
    };

    var shouldSort = function(items) {
        var item = _.find(items, function(item) {
            return item.type !== 'FilmStripImageItem' || // should sort iff there is no cut items in the filmstrip
                isDigit(item.currentOrder); // and all items have no order property set.
        });

        return typeof(item) === 'undefined';
    };
    

    this.execute = function() {
        if (mode && mode!=='custom') {
            
            var sort = sortFn[mode] || alphaSort;
            filmStripItems.sort(sort);

        } else {
            if(shouldSort(filmStripItems)) {
                filmStripItems.sort(alphaSort);
            } else {
                filmStripItems.sort(customSort);
            }
        }

        new PACE.FixFilmstripStacksCommand(filmStripItems).execute();
    };

    this.undo = function() {};
};