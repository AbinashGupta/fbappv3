'use strict';

angular.module('ngSocial.facebook', ['ngRoute','ngFacebook'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/facebook', {
    templateUrl: 'views/mainpage.html',
    controller: 'FacebookCtrl'
  });
  $routeProvider.when('/facebook/posts', {
    templateUrl: 'views/posts.html',
    controller: 'postsCtrl'
  });
}])

.config( function( $facebookProvider ) {
  $facebookProvider.setAppId('1198237676975868');
  $facebookProvider.setPermissions("email,public_profile, user_posts, publish_actions, user_photos, user_tagged_places, user_location");
})

.constant('geodist', window.geodist)

.run(function($rootScope){
	(function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
})

// .service('distCalculator', function(loc1, loc2, options) {
// 	return geodist(loc1, loc2, options);
// })

.controller('FacebookCtrl', ['$scope', '$facebook', 'geodist', function($scope, $facebook, geodist) {
	$scope.isLoggedIn = false;

	$scope.login = function(){
		$facebook.login().then(function(){
			$scope.isLoggedIn = true;
			refresh();
		});
	}

	$scope.logout = function(){
		$facebook.logout().then(function(){
			$scope.isLoggedIn = false;
			refresh();
		});
	}

	$scope.calcDistance = function() {
		$scope.distCalArr = [];
		var placesArr = $scope.places;
		placesArr.forEach(function(place, index, placesArr) {
			var distObj = {};
			distObj.lat = place.place.location.latitude;
			distObj.lon = place.place.location.longitude;
			var baseLoc = {lat: $scope.currLocation.location.latitude, lon: $scope.currLocation.location.longitude};
			var p1Loc = {lat:distObj.lat, lon:distObj.lon};
			if(index<(placesArr.length - 1)) {
				var p2Loc = {lat: placesArr[index + 1].place.location.latitude, lon: placesArr[index + 1].place.location.longitude};
				distObj.p1p2 = geodist(p2Loc, p1Loc, {unit: "km"});
			}
			else {
				distObj.p1p2 = null;
			}
			distObj.p1c = geodist(baseLoc, p1Loc, {unit: "km"});	
			$scope.distCalArr.push(distObj);
		})
	}

	function refresh(){
		$facebook.api("/me?fields=id,name,gender,locale,first_name,last_name,email,location").then(function(response){
			$scope.welcomeMsg = "Welcome "+ response.name;
			$scope.isLoggedIn = true;
			$scope.userInfo = response;
			console.log("Userinfo");
			console.log($scope.userInfo);
            $facebook.api('/me/picture').then(function(response){
                $scope.picture = response.data.url;
                $facebook.api('/me/permissions').then(function(response){
                    $scope.permissions = response.data;
                    $facebook.api('/me/posts').then(function(response){
                        console.log(response.data);
                        $scope.posts = response.data;
					});
                    $facebook.api('/me/tagged_places').then(function(response){
                        console.log(response.data);
                        $scope.places = response.data;
					})
					.then(function() { $facebook.api('/' + $scope.userInfo.location.id, {
						fields: 'location'
					}).then(function(locationResponse) {
						$scope.currLocation = locationResponse;
						console.log('Cuurent location object');
						console.log($scope.currLocation);
					}).then($scope.calcDistance).then(function() {
						console.log('--------------- distCalArray --------------');
						console.log($scope.distCalArr);
						});
					});
                });
            });
		},
		function(err){
			$scope.welcomeMsg = "Please Log In";
		});
	}

	$scope.postStatus = function(){
		var body = this.body;
		$facebook.api('/me/feed', 'post', {message: body}).then(function(response){
			$scope.msg = 'Thanks for Posting';
			refresh();
		});
	}

}])

.controller('postsCtrl', ['$scope', '$facebook', function($scope, $facebook) {

	refresh();

	function refresh(){
		$facebook.api("/me?fields=id,name,gender,locale,first_name,last_name,email,location").then(function(response){
			$scope.isLoggedIn = true;
			$scope.userInfo = response;
			$facebook.api('/me/posts').then(function(response){
				console.log('----------- POST -------------------');
				console.log(response.data);
				$scope.posts = response.data;
				$scope.allPosts = [];
				$scope.posts.forEach(function(curr_post) {
					$facebook.api('/' + curr_post.id)
					.then(function(postRes) {
						$scope.allPosts.push(postRes);
					});
				})
				console.log('------------All Posts --------------');
				console.log($scope.allPosts);
			});
		},
		function(err){
			$scope.welcomeMsg = "Please Log In";
		});
	}
}]);

// https://stackoverflow.com/questions/14968297/use-underscore-inside-angular-controllers/23984685#23984685