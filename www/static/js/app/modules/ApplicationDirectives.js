var Directives = angular.module("ApplicationDirectives", []);

/* FR : utilise le plugin bootstrap pop-over
 */
Directives.directive("popOver", function() {
    return function(scope, element, attrs) {
        var $target, options;
        if (element.attr("data-target")) {
            $target = $(attrs["target"]);
            $target.detach();
            options = {
                "html": true,
                "content": $target
            };
        }
        element.popover(options || {});
    };
});

/* FR : bascule l'élement en mode active en changant la classe
 */
Directives.directive("toggleActive", function() {
    return function(scope, element, attrs) {
        var _class = attrs.toggleActive;
        element.click(function() {
            if (element.hasClass(_class)) {
                element.removeClass(_class);
            } else {
                element.addClass(_class);
            }
        });
    };
});

/**
 * EN : 2 fields . if the origin field value
 * === current element value
 * current element value is valid
 */
Directives.directive("passwordVerify", function() {
    return {
        require: "ngModel",
        link: function(scope, element, attrs, ctrl) {
            // ajoute une fonction de vérification au parsers du controle
            ctrl.$parsers.unshift(function(viewValue) {
                var origin = scope.$eval(attrs["passwordVerify"]);
                if (origin !== viewValue) {
                    ctrl.$setValidity("passwordVerify", false);
                    return undefined;
                } else {
                    ctrl.$setValidity("passwordVerify", true);
                    return viewValue;
                }
            });
        }
    };
});

/**
 * EN : Masonry directive.
 * attributes : 
 * reload-on = will reload masonry when the model is updates , the model 
 * must be accessible in the scope
 * item-selector = masonry will apply on selected items
 * is-animated = animation turned on or off
 */
Directives.directive("masonry", function($timeout) {
    return function(scope, element, attrs) {
        console.log(arguments);
        var options = {};
        var init = false;
        var reloadOn = null;
        if (attrs['itemSelector'])
            options.itemSelector = attrs['itemSelector'];
        //if (attrs['columnWidth'])
        //    options.columnWidth = 230; //
        if (attrs["isAnimated"])
            options.isAnimated = true;
        // reload when model is updated
        if (attrs["reloadOn"]) {
            reloadOn = attrs["reloadOn"];
            scope.$watch(reloadOn, function(_new, _old) {
                console.log("execute mansonry");
                if (init === true) {
                    $timeout(function() {
                        element.masonry("reload");
                    });
                }
            });
        }
        // init masonry
        $timeout(
                function() {
                    element.imagesLoaded(function() {
                        element.masonry(options);
                        init = true;
                    });
                });
    };
});

Directives.directive("openModal", function() {
    return function(scope, element, attrs) {
        element.on("click", function(event) {
            var modalSelector = attrs["openModal"];
            $(modalSelector).modal("show");
        });
    };
});

Directives.directive("preloadImage", function() {
    return function(scope, element, attrs) {
        var imageToload = scope.$eval(attrs['preloadImage']);
        var lowSrc = attrs["lowSrc"];
        element.attr("src", lowSrc);
        var image = new Image();
        image.onload = function() {
            element.hide();
            element.attr("src", image.src);
            element.fadeIn(300);
        };
        image.onerror = function(error) {
            console.log("error", error);
        };
        image.src = imageToload;
    };
});

Directives.directive("bstTooltip", ["$timeout", function($timeout) {
        return function(scope, element, attrs) {
            $timeout(function() {
                return element.tooltip();
            }, 10);
        };
    }]);