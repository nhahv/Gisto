(function() {
    'use strict';

    angular.module('gisto')
        .controller('headerController', [
            '$scope', 'notificationService', '$location', 'appSettings', 'gistData',
            'onlineStatus', '$rootScope', 'ghAPI', headerController
        ]);

    function headerController($scope, notificationService, $location, appSettings, gistData, onlineStatus, $rootScope, ghAPI) {

        notificationService.login();

        notificationService.forward('receiveNotification', $scope);
        notificationService.forward('notificationRead', $scope);
        notificationService.forward('identify', $scope);
        notificationService.forward('disconnect', $scope);

        $scope.settings = appSettings.data;

        $scope.notifications = notificationService.notifications;

        $scope.updateGists = function () {
            if (!onlineStatus.isOnline()) {
                return;
            }

            var indicator = $('.gist-update-btn');
            indicator.addClass('fa-spin');

            ghAPI.startUpdate().then(function () {
                indicator.removeClass('fa-spin');
            });
        };

        // every 10 minutes run an update to check for updates in gists
        setInterval($scope.updateGists, 60 * 10 * 1000);

        $scope.logOut = function () {

            console.log('logging out');
            $rootScope.gistoReady = false;
            $scope.notifications.length = 0;
            notificationService.logout();

            gistData.list = [];
            appSettings.logOut();
        };

        $scope.onlineStatus = onlineStatus;

        $scope.$watch('onlineStatus.isOnline()', function (online) {
            if (online && window.ioSocket && (!window.ioSocket.socket.connected || !window.ioSocket.socket.reconnecting)) {
                notificationService.login();
            } else if (!online) {
                notificationService.disconnected();
            }
        });

        $scope.$on('socket:disconnect', function (e) {
            console.log('disconnected');
            notificationService.disconnected();
            // attempt to re login on disconnection
            notificationService.login();
        });

        $scope.$on('socket:identify', function (e, data) {
            // identify to the server
            console.log('recieved identify request');
            notificationService.register();
        });
        notificationService.register();

        $scope.$on('socket:receiveNotification', function (e, data) {
            console.log('recieve: ', data);
            notificationService.add(data);
            console.log(data);
        });

        $scope.$on('socket:notificationRead', function (e, data) {
            // remove read notification
            console.log('recieved read notification deleting notification');
            (data && data.gistId) && notificationService.remove(data.gistId);
        });

        $scope.loadExternalGist = function (id, user) {
            $location.url('/shared/' + user + '/' + id);
        };

        $scope.reject = function (id) {
            console.log('remove id: ' + id);
            notificationService.remove(id);
            notificationService.send('notificationRead', {gistId: id});
        };

    }

})();