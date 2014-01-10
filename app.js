
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var captcha_index = 0;
var apiResponses = [];

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log('Decaptcha server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);

function removeApi( id, room ){
	if( apiResponses.length ){
			for(var i=0; i<apiResponses.length; i++){
				var apiResponse = apiResponses[i];
				if( id == apiResponse.captcha.id ){
					apiResponses.splice(i, 1);
					io.sockets.in(room).emit('remove', id);
					break;
				}
			}
		}
}

io.sockets.on('connection', function (socket) {

	socket.on('key', function(data) {
		socket.join(data.room);
		var captchas = [];
		if( apiResponses.length ){
			for(var i=0; i<apiResponses.length; i++){
				var apiResponse = apiResponses[i];
				if( apiResponse.key == data.room ){
					captchas.push(apiResponse.captcha);
				}
			}
		}
		if(captchas.length)
			socket.broadcast.to(socket.room).emit('add', captchas);
	});

	socket.on('response', function(captcha) {
		if( apiResponses.length ){
			for(var i=0; i<apiResponses.length; i++){
				var apiResponse = apiResponses[i];
				if( captcha.id == apiResponse.captcha.id ){
					apiResponse.res.send(captcha.response);
					apiResponses.splice(i, 1);
					io.sockets.in(socket.room).emit('remove', captcha.id);
					break;
				}
			}
		}
	});
	
});


app.get('/', function(req, res){
  res.render('index');
});

app.get('/keys/:id', function(req, res){
  res.render("view", {key:req.param('id')});
});

app.post('/keys/:id', function(req, res){
	if( !req.param('img') ){
	  res.send(403, "Param img not is passed");	
	} else {
		var captcha = {id:captcha_index, img:req.param('img')};
		req.connection.on('close',function(){
			console.log("Fechou");
			removeApi(captcha.id, req.param('id'));
		});
		io.sockets.in(req.param('id')).emit('add', [captcha]);
		apiResponses.push({key:req.param('id'), res:res, captcha:captcha});
		captcha_index++;	
	}

});