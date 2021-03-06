/**
 * EN : main module
 * FR : module principal.
 * @copyrights 2014 mparaiso <mparaiso@online.fr>
 */
/*global $,console,angular*/
(function () {
    "use strict";
    angular.module("markme",
        ["ApplicationDirectives", "ApplicationServices", "ApplicationFilters", 'ngRoute'],
        function ($routeProvider, $httpProvider) {

            $routeProvider.when("/tag/:tag", {
                templateUrl: "/markme/partials/bookmarks.html",
                controller: "BookmarkCtrl"
            })
                .when('/favorites', {
                    templateUrl: '/markme/partials/bookmarks.html',
                    controller: 'FavoritesCtrl'
                })
                .when("/bookmark/search/:search", {
                    templateUrl: "/markme/partials/bookmarks.html",
                    controller: "BookmarkCtrl"
                })
                .when("/bookmark", {
                    templateUrl: "/markme/partials/bookmarks.html",
                    controller: "BookmarkCtrl"
                })
                .when("/tag", {
                    templateUrl: "/markme/partials/tags.html",
                    controller: "TagCtrl"
                })
                .when("/account", {
                    templateUrl: "/markme/partials/account.html",
                    controller: "AccountCtrl"
                })
                .otherwise({redirectTo: "/bookmark"});

            $httpProvider.interceptors.push('accessDeniedInterceptor');
        })
        .factory('accessDeniedInterceptor', function ($q, $window) {
            return {
                responseError: function (rejection) {
                    if (rejection.status === 403) {
                        $window.location = "/";
                        return;
                    }
                    return $q.reject(rejection);
                }
            };
        })
        .value('Config', {
            editBookmarkModalId: 'bookmark-edit',
            bookmarksPerPage: 25,
            maxSizeUpload: '10M',
            importLimit: 2000,
            autoCompleteParse: function (data) {
                var rows = [];
                if (data && data.tags) {
                    for (var i = 0; i < data.tags.length; i++) {
                        var tag = data.tags[i];
                        rows[rows.length] = {data: [tag], value: tag, result: tag};
                    }
                }
                return rows;
            }})
        .controller("MainCtrl", function ($scope, Users, Bookmarks, Alert, Config) {
            // initialization
            $scope.Config = Config;
            $scope.Bookmarks = Bookmarks;
            $scope.Alert = Alert;
            $scope.Users = Users;
            Alert.info('Application loaded successfully!');
            Users.getCurrent();

        })
        .controller("NavigationCtrl", function NavigationCtrl($scope, Bookmarks, Users, mpModalService, Config, $routeParams, $location) {
            $scope.Users = Users;
            $scope.search = $routeParams.search;
            $scope.find = function (search) {
                // @note @angular dynamicaly change the current page route without refreshing the page
                $location.path('/bookmark/search/' + search);
            };
            $scope.create = function () {
                Bookmarks.current = {tags: []};
                mpModalService.showModal(Config.editBookmarkModalId);
            };
        })
        .controller('BookmarkRowCtrl', function BookmarkRowCtrl($timeout, $scope, Config, Bookmarks, Alert, mpModalService) {
            $scope.toggleFavorite = function (bookmark) {
                Bookmarks.toggleFavorite(bookmark);
                bookmark.favorite = !bookmark.favorite;
            };
            $scope.edit = function (bookmark) {
                $timeout(function () {
                    Bookmarks.current = angular.copy(bookmark);
                    Bookmarks.current.tags = Bookmarks.current.tags || [""];
                    Bookmarks.current.timestamp = Date.now();
                    mpModalService.showModal(Config.editBookmarkModalId);
                });
            };
            $scope.remove = function (bookmark) {
                Alert.info("Deleting %s ...".replace("%s", bookmark.title));
                return Bookmarks.remove(bookmark)
                    .then(function () {
                        Alert.info("Bookmark %s removed.".replace("%s", bookmark.title));
                    })
                    ['catch'](function () {
                    Alert.danger("Error removing bookmark %s .".replace("%s", bookmark.title));
                });
            };
        })
        .controller("BookmarkCtrl", function BookmarkCtrl($scope, mpModalService, $timeout, $routeParams, Alert, Bookmarks, Config, Thumbnails) {

            $scope.Thumbnails = Thumbnails;
            $scope.Bookmarks = Bookmarks;
            Bookmarks.bookmarks = [];

            $scope.nextBookmarkPage = function () {
                if ($scope.search) {
                    return $scope.searchBookmarks($scope.search, ++$scope.offset, $scope.limit);
                } else if ($scope.tag) {
                    $scope.searchBookmarksByTag($scope.tag++, $scope.offset, $scope.limit);
                } else {
                    return $scope.listBookmarks(++$scope.offset, $scope.limit);
                }
            };
            $scope.listBookmarks = function (offset, limit) {
                $scope.fetchingBookmarks = true;
                return $scope.Bookmarks.list(offset, limit)
                    .then(onBookmarkResponseOk)
                    ['catch'](onBookmarkResponseError)
                    ['finally'](onBookmarkResponseEnd);
            };
            $scope.searchBookmarks = function (search, offset, limit) {
                $scope.fetchingBookmarks = true;
                return Bookmarks.search(search, offset, limit)
                    .then(onBookmarkResponseOk)
                    ['catch'](onBookmarkResponseError)
                    ['finally'](onBookmarkResponseEnd);
            };
            $scope.searchBookmarksByTag = function (tag, offset, limit) {
                $scope.fetchingBookmarks = true;
                return Bookmarks.searchByTag(tag, offset, limit)
                    .then(onBookmarkResponseOk)
                    ['catch'](onBookmarkResponseError)
                    ['finally'](onBookmarkResponseEnd);
            };
            $scope.offset = $routeParams.offset || 0;
            $scope.limit = Config.bookmarksPerPage;
            $scope.fetchingBookmarks = true;
            if ($routeParams.search) {
                $scope.search = $routeParams.search;
                $scope.searchBookmarks($scope.search, $scope.offset, $scope.limit);
            } else if ($routeParams.tag) {
                $scope.tag = $routeParams.tag;
                $scope.searchBookmarksByTag($scope.tag, $scope.offset, $scope.limit);
            } else {
                $scope.listBookmarks($scope.offset, $scope.limit);
            }
            /* event handlers */
            function onBookmarkResponseOk(lastBookmarkBatch) {
                $scope.lastBookmarkBatch = lastBookmarkBatch;
            }

            function onBookmarkResponseEnd() {
                $scope.fetchingBookmarks = false;
            }

            function onBookmarkResponseError(err) {
                Alert.danger("Error fetching bookmarks.");
            }
        })
        .controller('FavoritesCtrl', function FavoritesCtrl($scope, Bookmarks, Thumbnails, $routeParams, Config, Alert) {
            $scope.Bookmarks = Bookmarks;
            $scope.Thumbnails = Thumbnails;
            Bookmarks.bookmarks = [];
            $scope.Config = Config;
            $scope.Alert = Alert;
            $scope.limit = Config.bookmarksPerPage;
            $scope.fetchingBookmarks = true;
            $scope.offset = $routeParams.offset || 0;
            $scope.limit = Config.bookmarksPerPage;
            $scope.nextBookmarkPage = function () {
                return  getFavorites(++$scope.offset, $scope.limit);
            };
            function getFavorites(offset, limit) {
                return   Bookmarks.getFavorites(offset, limit)
                    .then(onBookmarkResponseOk)
                    ['catch'](onBookmarkResponseError)
                    ['finally'](onBookmarkResponseEnd);
            }

            getFavorites($scope.offset, $scope.limit);
            function onBookmarkResponseOk(lastBookmarkBatch) {
                $scope.lastBookmarkBatch = lastBookmarkBatch;
            }

            function onBookmarkResponseEnd() {
                $scope.fetchingBookmarks = false;
            }

            function onBookmarkResponseError(err) {
                Alert.danger("Error fetching bookmarks.");
            }
        })
        .controller('BookmarkFormCtrl', function BookmarkFormCtrl($scope, Bookmarks, Alert, $rootScope, mpModalService, Config) {
            $scope.Bookmarks = Bookmarks;
            $scope.Config = Config;
            $scope.save = function (bookmark) {
                Alert.info("Saving bookmark " + bookmark.title + ", please wait...");
                Bookmarks.save(bookmark)
                    .then(function (bookmark) {
                        Alert.info('Bookmark "%s" saved'.replace("%s", bookmark.title));
                        if (!$rootScope.$$phase) {
                            $rootScope.$apply('Bookmarks.bookmarks');
                        }
                    })
                    ['catch'](function () {
                    Alert.danger("Error saving bookmark");
                })['finally'](function () {
                    mpModalService.hideModal(Config.editBookmarkModalId);
                });
            };
            $scope.suggest = function (url) {
                Bookmarks.suggesting = true;
                Bookmarks.suggest(url)
                    .then(function (data) {
                        Bookmarks.current.title = data.title || Bookmarks.current.title;
                        Bookmarks.current.description = data.description || Bookmarks.current.description;
                        if (data.tags && data.tags.length > 0) {
                            Bookmarks.current.tags = data.tags;
                        }
                    })
                    ['catch'](function (err) {
                    console.log(err);
                })
                    ['finally'](function () {
                    Bookmarks.suggesting = false;
                });
            };
        })
        .controller("TagCtrl", function TagCtrl($scope, Alert, Tags) {
            $scope.Tags = Tags;
            Tags.get()
                ['catch'](function () {
                Alert.danger("Error fetching tags.");
            })
                ['finally'](function () {
            });
        })
        .controller("AccountCtrl", function AccountCtrl($scope, $interval, $window, Alert, $cacheFactory, $location, Bookmarks, Users, Config) {
            $scope.Users = Users;
            $scope.Config = Config;
            $scope.importForm = {};
            $scope.importing = false;
            $scope.import = function () {
                $scope.importing = true;
                var i = 0;
                var div = 10;
                var interval = $interval(function () {
                    Alert.info('Importing bookmarks from "' + $scope.importForm.files[0].name + '"' + '..........'.slice(0, i++ % div));
                }, 1000);
                Bookmarks.import($scope.importForm.files[0])
                    .then(function () {
                        Alert.success('Bookmarks successfully imported !');
                        $location.path('/bookmark');
                        console.log($cacheFactory.info());
                    })
                    ['catch'](function (err) {
                    console.log(err);
                    Alert.danger('Bookmark import failed !');
                    console.log(err || err.data);
                })
                    ['finally'](function () {
                    $scope.importing = false;
                    $interval.cancel(interval);
                });
            };
            $scope.export = function () {
                $scope.importing = true;
                Alert.info('Exporting bookmarks,please wait.');
                var createObjectURL = $window.URL.createObjectURL || $window.URL.webkitCreateObjectURL;
                Bookmarks.export()
                    .then(function (bookmarks) {
                        var blob = new $window.Blob(bookmarks.match(/.{1,200}/mg), {type: 'text/html'});
                        var d = new Date();
                        $window.open(createObjectURL(blob), 'Bookmark-export-' + (d.toLocaleDateString('en', {weekday: 'short', month: 'short', year: 'numeric'})).replace(' ', '-') + '-.html', "menubar=1");
                        Alert.success('Bookmark exported ,please save the page opened in a new window.');
                    })
                    ['catch'](function (err) {
                    Alert.danger('Failed to export bookmarks.');
                })
                    ['finally'](function () {
                    $scope.importing = false;
                });
            };
        })
        .run(function () {
            $.ajaxSetup({cache: true});
        });

}());