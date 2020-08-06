var PACE = PACE || {};

PACE.utils = {
    // Generating GUID
	generateGUID: function(length) {
		var s4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		}

		return (s4() + s4() + "-" + s4() + "-4" + s4().substr(0,3) + "-" + s4() + "-" + s4() + s4() + s4()).toLowerCase();
	},

	// Converts timestamp into relative time
	relativeTime: function(time) {
        // Adapted from James Herdman's http://bit.ly/e5Jnxe
        var period = new Date(time);
        var delta = new Date() - period;

        if (delta <= 10000) {	// Less than 10 seconds ago
            return 'Just now';
        }

        var units = null;

        var conversions = {
            millisecond: 1,		// ms -> ms
            second: 1000,		// ms -> sec
            minute: 60,			// sec -> min
            hour: 60,			// min -> hour
            day: 24,			// hour -> day
            month: 30,			// day -> month (roughly)
            year: 12			// month -> year
        };

        for (var key in conversions) {
            if (delta < conversions[key]) {
                break;
            }
            else {
                units = key;
                delta = delta / conversions[key];
            }
        }

        // Pluralize if necessary:
        delta = Math.floor(delta);
        if (delta !== 1) {
        	units += 's';
        }

        return [delta, units, "ago"].join(' ');
    },

    // Converst urls in string into anchor tags
    urlHyperlinks: function(str) {
        return str.replace(/\b((http|https):\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
    },

    // Fires interval N times
    setIntervalN: function(callback, delay, repetitions) {
        var n = 0;
        var intervalID = setInterval(function() {
           callback();

           if (++n === repetitions) {
               clearInterval(intervalID);
           }
        }, delay);
    },

    containsDragType: function(types, type) {
        var result = _.contains(_.values(types), type);
        return result;
    },

    parsePageNumbers: function(pages) {
        if (!pages || pages=="")
            return null;

        var result = [];
        var regexp = /(\d+\-\d+)|(\d+)/g;
        var matches = pages.match(regexp);
        for (var j = 0; j < matches.length; j++) {
            var grp = matches[j];
            if (grp.indexOf("-")>0) {
                var range = grp.split("-"),
                    from = parseFloat(range[0]),
                    to = parseFloat(range[1]);

                for(var i=from;i<=to;i++) {
                    if (result.indexOf(i)==-1) result.push(i);
                }
            } else {
                var num = parseFloat(grp);
                if (result.indexOf(num)==-1) result.push(num);
            }
        }
        return result;
    },

    slug: function(text) {
        var result = text.normalize('NFD');
        //result = result.replace(/[^\p{ASCII}]/g, '');
        result = result.replace(/[^a-zA-Z0-9\s\.]/g, ' '); // 2
        result = result.replace(/\s+/g, ' ');
        result = result.toLowerCase();
        result = result.replace(" ", "-");

        return result;
    }
};
