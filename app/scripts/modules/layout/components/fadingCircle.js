angular.module('pace.order')
.factory('FadingCircleComponent', [function() {

    return React.createClass({

        render: function() {
            return (
                React.createElement("div", null, 
                    React.createElement("div", {className: "sk-fading-circle"}, 
                      React.createElement("div", {className: "sk-circle1 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle2 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle3 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle4 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle5 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle6 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle7 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle8 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle9 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle10 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle11 sk-circle"}), 
                      React.createElement("div", {className: "sk-circle12 sk-circle"})
                    )
                )
            );
        }

    });

}]);