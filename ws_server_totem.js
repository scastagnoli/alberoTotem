//Includo la libreria onoff e inizializzo i pin
var GPIO = require('onoff').Gpio,
btn1 = new GPIO(21,'in', 'rising'),	//PLAY/PAUSE
btn2 = new GPIO(13,'in', 'rising'),	//STOP
btn3 = new GPIO(19,'in', 'rising'),	//AVANTI
btn4 = new GPIO(16,'in', 'rising');	//INDIETRO

//Includo la libreria ws e preparo il sever
var WebSocketServer = require('ws').Server, 
	wss = new WebSocketServer({ port: 8080 });
var premuto = false;

//Gestore di omxplayer
var OmxManager = require('omx-manager');
var manager = new OmxManager();
manager.setVideosDirectory('/home/pi/totem/video/');

//Inizializzo la lista dei video
var listaCorrente = 0;
var videoIndex = Array(0,0);
var videoList = 	[
						'01.mp4', 
						'02.mp4',
						'03.mp4',
						'04.mov',
						'05.mov',
						'06.mov',
						'07.mp4',
						'08.mp4'
					];
var nVideo = 8;	//numero di video per ogni gruppo
var video = manager.create(videoList[videoIndex[0]]); // OmxInstance ws.send("avvia");
videoStatus = video.getStatus();

function refreshInterface(w)
{
	video.stop();	//Alla fine del video faccio stop
	w.send("stop");
	console.log("Ripristino interfaccia");
}

wss.on('connection', function connection(ws) {
	
	video.on('end', function(){
		refreshInterface(ws);
	});
		
	console.log("Connesso");
	btn1.watch(function(err,value){	//PLAY/PAUSE
		if(premuto)
		{
			videoStatus = video.getStatus();
			if(videoStatus.playing)
			{
				console.log("pause");
				video.pause();
			}
			else
			{
				console.log("play");
				ws.send("play");
				video.play();
			}
		}
		premuto = !premuto;
	})
	
	btn2.watch(function(err,value){	//STOP
		if(premuto)
		{
			videoStatus = video.getStatus();
			if(videoStatus.current!="")
			{
				console.log("stop");
				video.stop();
				ws.send("stop");
				
			}
			else
			{
				ws.send("changeList");
				listaCorrente++;
				listaCorrente%=2;
				if(listaCorrente==1)
				{
					videoList = 	[
										'09.mov', 
										'10.mov',
										'11.mov',
										'12.mov',
										'13.mov',
										'14.mov',
										'15.mov',
										'16.mov'
									];	
				}
				if(listaCorrente==0)
				{
					videoList = 	[
										'01.mp4', 
										'02.mp4',
										'03.mp4',
										'04.mov',
										'05.mov',
										'06.mov',
										'07.mp4',
										'08.mp4'
									];	
					
				}
				video = manager.create(videoList[videoIndex[listaCorrente]]);
				video.on('end', function(){
					refreshInterface(ws);
				});
			}
			
		}
		premuto = !premuto;
	})
	
	btn3.watch(function(err,value){	//AVANTI
		if(premuto)
		{
			videoStatus = video.getStatus();
			if(videoStatus.current=="")
			{
				if(videoIndex[listaCorrente]>nVideo-2)
					videoIndex[listaCorrente] = 0;
				else
					videoIndex[listaCorrente]++;
				video = manager.create(videoList[videoIndex[listaCorrente]]);
				video.on('end', function(){
					refreshInterface(ws);
				});
				ws.send("n");
				console.log("next: lista 1 = " + videoIndex[0] + ",lista 2 = " + videoIndex[1]);
			}
			else
				video.seekForward();
			
		}
			
		premuto = !premuto;
	})
	
	btn4.watch(function(err,value){	//INDIETRO
		if(premuto)
		{
			videoStatus = video.getStatus();
			if(videoStatus.current=="")
			{
				if(videoIndex[listaCorrente]<1)
						videoIndex[listaCorrente] = nVideo-1;
					else
						videoIndex[listaCorrente]--;
				video = manager.create(videoList[videoIndex[listaCorrente]]);
				video.on('end', function(){
					refreshInterface(ws);
				});
				ws.send("p");
				console.log("previous: lista 1 = " + videoIndex[0] + ",lista 2 = " + videoIndex[1]);
			}
			else
				video.seekBackward();
		}
			
		premuto = !premuto;
	})
	
	ws.on('close',function close(){
		console.log('Disconnesso!');
		btn1.unwatchAll();
		btn2.unwatchAll();
		btn3.unwatchAll();
		btn4.unwatchAll();
	}); 
  
});
