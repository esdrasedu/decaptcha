var Decaptcha = angular.module('Decaptcha', [])

Decaptcha.controller('IndexController', function($scope) {

	$scope.key = '';

  $scope.generate = function(){
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var key = '';
    for( var i=0; i < 10; i++ )
      key += possible.charAt(Math.floor(Math.random() * possible.length));

   $scope.key = key;
  };

});

Decaptcha.controller('ViewController', function($scope) {
	
	$scope.captchas = [];

	$scope.init = function( key ){

		$scope.socket = io.connect();

	  $scope.socket.on('add', function ( captchas ) {
	  	angular.forEach(captchas, function(captcha){
	  		$scope.captchas.push(captcha);
	  	});
	  	$scope.$digest();
	  });

	  $scope.socket.on('remove', function ( id ) {
	  	if( $scope.captchas.length ){
	  		for( var i = 0; i < $scope.captchas.length; i++ ){
	  			var captcha = $scope.captchas[i];
	  			if( captcha.id == id ){
	  				$scope.captchas.splice(i, 1);
				  	$scope.$digest();
	  				break;
	  			}
	  		}
	  	}
	  });
	  $scope.socket.emit('key', {room:key});
	};

	$scope.send = function( captcha ){
		$scope.socket.emit('response', captcha);
	}

});