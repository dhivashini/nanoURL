var myApp = angular.module('myApp',[]);

myApp.controller('AppCtrl', ['$scope', '$http',
	function($scope, $http){
		$scope.IsResultVisible = false;
		$scope.shortenedURLs = [];

		$scope.shortenURL = function() {
			$scope.myForm.$invalid = true;

			var longURL = $scope.longURL.name;
			var duplicate = false;

			for(var i in $scope.shortenedURLs){
				if($scope.shortenedURLs[i].longURL == longURL) {
					duplicate = true;
					$scope.longURL.name = "";
				}
			}
			
			var customFlag = false;
			if(!($scope.customURL == undefined)){
				var pattern = new RegExp(/[a-zA-Z0-9]{8}$/);
				if(!pattern.test($scope.customURL.name)) {
					return false;
				} else {
					customFlag = true;
				}
			}

			if(!duplicate) {
				
				var data = {
						longURL : $scope.longURL.name,
						customFlag : customFlag,
						customURL : ($scope.customURL==undefined)?"":$scope.customURL.name
					}
					
				$http.post('/longURL', data).success(function(response) {
					var tLongURL = "";
					if(longURL.length > 75) {
						tLongURL = longURL.substring(0, 75) + "...";
					} else {
						tLongURL = longURL;
					}
					var shortURL = response;

					$scope.shortenedURLs.push({longURL:longURL, tLongURL:tLongURL, shortURL:shortURL});	

					$scope.IsResultVisible = true;
					$scope.longURL.name = "";
				});
			}
    	}

		$http.get('/analytics').success(function(data) {
            $scope.analyticsData = data;
        }).error(function(data) {
            console.log('Error: ' + data);
            
        });

        $scope.showDetails = function(shortURL) {
        	$scope.analyticsCheck = shortURL;
        	shortURL = { 'shortURL': shortURL };
			$scope.typeData = false;
			
        	$http.post('/analyticsByURL', shortURL).success(function(response) {

				$scope.clientBrowser = [];
				$scope.clientCountry = [];
				$scope.clientDevice = [];
				$scope.clientDeviceType = [];
				$scope.clientIP = [];
				$scope.clientOS = [];

				response.forEach(function(obj) {

				    obj.forEach(function(data) {

				    	if(data.clientBrowser) {
				    		$scope.clientBrowser.push({clientBrowser:data.clientBrowser, count:data.count});
				    	} else if(data.clientCountry) {
				    		$scope.clientCountry.push({clientCountry:data.clientCountry, count:data.count});
				    	} else if(data.clientDevice) {
				    		if(data.clientDevice == "undefined undefined") {
				    			$scope.clientDevice.push({clientDevice:"Other", count:data.count});
				    		} else {
				    			$scope.clientDevice.push({clientDevice:data.clientDevice, count:data.count});
				    		}
				    	} else if(data.clientDeviceType) {
				    		$scope.clientDeviceType.push({clientDeviceType:data.clientDeviceType, count:data.count});
							$scope.typeData = true;
				    	} else if(data.clientIP) {
				    		$scope.clientIP.push({clientIP:data.clientIP, count:data.count});
				    	} else if(data.clientOS) {
				    		$scope.clientOS.push({clientOS:data.clientOS, count:data.count});
				    	}
						
						if(!data.clientDeviceType && $scope.typeData == false) {
							$scope.typeData = false;
						}
					});

				});
			}).error(function(response) {
	            console.log('Error: ' + response);
	        });
        }
		
		$scope.openForm = function(shortURL, longURL) {
			$scope.sendShortURL = shortURL;
			$scope.sendLongURL = longURL;
		}
		
		$scope.sendMail = function() {

			var data = {
				emailId: $scope.email.id,
				shortURL: $scope.sendShortURL,
				longURL: $scope.sendLongURL
			};
			$http.post('/send', data).success(function(response) {
				console.log(response);
				$('#emailModal').modal('hide');
			});
    	}
	}
]);
