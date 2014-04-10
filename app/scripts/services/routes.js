'use strict';

angular.module('taxigoApp')
    .factory('routes', ['$rootScope', '$timeout', '$restful', '$logger', 'gmaps', 'taxi', '$auth', 'appConfig', '$fetchData',
        function ($rootScope, $timeout, $restful, $logger, gmaps, taxi, $auth, appConfig, $fetchData) {

            var routes = {
                chooseTaxi: function (taxiData, isQuick, cb) {
                    console.log('taxiData', taxiData);
                    var taxiID = taxiData.id;
                    var customerId = $auth.getUserId() || $auth.getAppRegisterInfo().id,
                        routerInfo;

                    $logger.info('chooseTaxi', 'customerId', customerId);
                    $logger.info('chooseTaxi', '$auth.getUserId()', $auth.getUserId());
                    $logger.info('chooseTaxi', '$auth.getAppRegisterInfo()', $auth.getAppRegisterInfo());

                    if (_.size(gmaps.directionInfo) > 0) {
                        routerInfo = {
                            startPoint: gmaps.directionInfo.legs[0].start_address,
                            endPoint: gmaps.directionInfo.legs[0].end_address,
                            duration: gmaps.directionInfo.legs[0].duration.value,
                            distance: gmaps.directionInfo.legs[0].distance.value,
                            amount: (gmaps.directionInfo.legs[0].distance.value / 1000) * 12000
                        };

                    } else {

                        routerInfo = {
                            startPoint: document.getElementById('originInput').value,
                            endPoint: document.getElementById('originInput').value
                        };

                    }

                    if (taxi.listCurrentTaxi.hasOwnProperty(taxiID)) {
                        gmaps.map.panTo(new google.maps.LatLng(taxi.listCurrentTaxi[taxiID].lat, taxi.listCurrentTaxi[taxiID].lat));
                    }


                    taxi.createRoutes(taxiID, customerId, routerInfo, function (err, result) {

                        if (err) {
                            cb(err, null);
                            $logger.info('chooseTaxi', 'err', err);
                        } else {
                            cb(null, result);
                            $logger.info('chooseTaxi', 'result', result);
                            taxi.setDirectionInfo(result.data);
                            taxi.setCurrentStatus(1);
                            if (gmaps.listMarkerTaxi.length) {
                                angular.forEach(gmaps.listMarkerTaxi, function (v, k) {
                                    if (v.carLic !== taxiData.username) {
                                        v.setMap(null);
                                    }
                                });
                            }

                            ///gmaps.currentPoint.setMap(null);

                            var chooseTaxiData = {
                                carLic: taxiData.username,
                                roomID: taxi.getCurrentRoomID(),
                                customerId: customerId,
                                customerDeviceId: appConfig.deviceId,
                                routeId: result.data[0].id,
                                isQuick: isQuick || false
                            };
                            socketIo.emit('choose:taxi', chooseTaxiData);
                        }
                    });
                },
                getLastRoute: function (customerId, cb) {
                    var filter = [
                        {
                            property: 'customer',
                            value: customerId,
                            type: 'string',
                            comparison: 'eq'
                        }
                    ];
                    var sorter = [
                        {
                            property: 'startAt',
                            direction: 'DESC' +
                                ''
                        }
                    ];
                    $restful.get({table: 'RouteHistories', start: 0, limit: 10000, filter: JSON.stringify(filter), sort: JSON.stringify(sorter)}, function (resp) {
                        if (resp.success) {
                            cb(null, resp.data);
                        } else {
                            cb(resp.message, null);
                        }

                    });

                }
            };


            return routes;
        }])
;