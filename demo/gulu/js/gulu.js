$('#upload').change(function(){
//==========Get Video==========
	var file=$(this)[0].files[0],
		filetype='',
		url,i=0;

	while(i++<3) filetype=file.name[file.name.length-i].toLowerCase()+filetype;
	if(filetype!='mp4'&&filetype!='mkv'&&filetype!='mov'&&filetype!='ogg')
		return alert('仅支持mp4,mkv,mov和ogg格式');
	if(window.createObjectURL)
		url=window.createObjectURL(file)
	else if(window.createBlobURL)
			url=window.createBlobURL(file)
	else if(window.URL && window.URL.createObjectURL)
			url=window.URL.createObjectURL(file)
	else if(window.webkitURL && window.webkitURL.createObjectURL)
			url=window.webkitURL.createObjectURL(file);
	$('video').attr('src',url).css({'position':'absolute','background':'black'});

//==========Auto get video title,episode and subtitle group==========
	var subgroup='',
		videotitle='',
		episode='',
		size=0,
		isget=1;
		i=1;

	if(file.name[i-1]=='['){
		while(file.name[i]!=']') subgroup+=file.name[i++];
		i+=2;
		if(file.name[i-1]=='['){
			while(file.name[i]!=']') videotitle+=file.name[i++];
			i+=2;
			if(file.name[i-1]=='['){
				while(file.name[i]!=']') episode+=file.name[i++];
			}else isget=0
		}else isget=0
	}else isget=0;//English word or number should be half size,or direct get the width
	//if(subgroup and videotitle and episode NOT in MySQL) isget=0;
	if(isget==0){//Get info from users' input
		$('#videotitle').text('自动匹配弹幕失败_(:з」∠)_').css('font-size',30);
		$('#episode').text('⑨').css('font-size',30);
		$('#subgroup').text('才不是因为我笨').css('font-size',30);
		
		$('#box').slideDown(300);
		$('#box span').click(function(){
			$('#box').slideUp(300);
		});

		/*
		videotitle=input('videotitle');
		episode=select('episode');
		subgroup=select('subgroup');
		isget=1;
		*/
	}
	if(isget){
		//load flying comments
		$('#box').css('display','none');
		$('#videotitle').text(videotitle).css('font-size',Math.min(360/videotitle.length*1.8,30));
		$('#subgroup').text(subgroup).css('font-size',Math.min(220/subgroup.length*1.8,30));
		$('#episode').text(episode).css('font-size',Math.min(60/episode.length*1.8,30));
	}
//==========Controls==========
	var point_minute=0,
		point_second=0,
		isplay=0,
		ismute=0,
		tmp_volume=1,
		iswide=0,
		ison=1;

	//__________Progress Bar__________
	$('#progressbar').click(function(e){
		if($('video')[0].currentTime){
			$('#progress').css('width',e.offsetX+'px');
			if(iswide) $('video')[0].currentTime=e.offsetX*$('video')[0].duration/880
			else $('video')[0].currentTime=e.offsetX*$('video')[0].duration/560;
		}
	})
	$('#progressbar').mousemove(function(e){
		if(iswide){
			point_minute=Math.floor(e.offsetX*$('video')[0].duration/880/60);
			point_second=Math.floor(e.offsetX*$('video')[0].duration/880%60);
		}else{
			point_minute=Math.floor(e.offsetX*$('video')[0].duration/560/60);
			point_second=Math.floor(e.offsetX*$('video')[0].duration/560%60);
		}
		if(point_minute<0) point_minute=0;
		if(point_second<0) point_second=0;
		if(point_minute<10) point_minute='0'+point_minute;
		if(point_second<10) point_second='0'+point_second;
		$(this).attr('title',point_minute+':'+point_second);
	})
	setInterval(function(){
		var	progress_width,
			minute=Math.floor($('video')[0].currentTime/60),
			second=Math.floor($('video')[0].currentTime%60),
			totle_minute=Math.floor($('video')[0].duration/60),
			totle_second=Math.floor($('video')[0].duration%60);

		if(iswide)
			progress_width=$('video')[0].currentTime*880/$('video')[0].duration
		else
			progress_width=$('video')[0].currentTime*560/$('video')[0].duration;
		$('#progress').css('width',progress_width+'px');
		if(minute<0) minute=0;
		if(second<0) second=0;
		if(minute<10) minute='0'+minute;
		if(second<10) second='0'+second;
		if(totle_minute<10) totle_minute='0'+totle_minute;
		if(totle_second<10) totle_second='0'+totle_second;
		if(!totle_minute) totle_minute='00';
		if(!totle_second) totle_second='00';
		$('#time').text(minute+':'+second+'/'+totle_minute+':'+totle_second);
		if($('video')[0].ended) location.reload();
	})

	//__________Play & Pause__________
	function playbutton(){
		if(isplay){
			$('#play').css('background','url(img/icon/4-9.png) no-repeat');
			$('video')[0].pause();
		}else{
			$('#play').css('background','url(img/icon/4-10.png) no-repeat');
			$('video')[0].play();
		}
		isplay=1-isplay;
	}
	$('#play').click(playbutton);
	$('video').click(playbutton);

	//__________Volume__________
	$('#volume').click(function(){
		if(ismute){
			if(tmp_volume>=0.75)
				$(this).css('background','url(img/icon/10-9.png) no-repeat');
			if(tmp_volume>=0.5&&tmp_volume<0.75)
				$(this).css('background','url(img/icon/10-8.png) no-repeat');
			if(tmp_volume>=0.25&&tmp_volume<0.5)
				$(this).css('background','url(img/icon/10-7.png) no-repeat');
			if(tmp_volume<0.25)
				$(this).css('background','url(img/icon/10-6.png) no-repeat');
			$('video')[0].volume=tmp_volume;
		}else{
			$(this).css('background','url(img/icon/10-10.png) no-repeat');
			tmp_volume=$('video')[0].volume;
			$('video')[0].volume=0;
		}
		ismute=1-ismute;
	})
	$('#volume').mouseenter(function(){
		$('#volumebar_now').show();
		$('#volumebar').click(function(e){
			$('video')[0].volume=1-e.offsetY/40;
			tmp_volume=$('video')[0].volume;
			ismute=0;
			$('#volumebar_now').css('height',e.offsetY);
			if($('video')[0].volume>=0.75)
				$('#volume').css('background','url(img/icon/10-9.png) no-repeat');
			if($('video')[0].volume>=0.5&&$('video')[0].volume<0.75)
				$('#volume').css('background','url(img/icon/10-8.png) no-repeat');
			if($('video')[0].volume>=0.25&&$('video')[0].volume<0.5)
				$('#volume').css('background','url(img/icon/10-7.png) no-repeat');
			if($('video')[0].volume<0.25)
				$('#volume').css('background','url(img/icon/10-6.png) no-repeat');
		})
	})
	$('#volumebar_now').mouseleave(function(){
		$(this).hide();
	})

	//__________wide Screen__________
	$('#widescreen').click(function(){
		if(iswide){
			$(this).css('background','url(img/icon/9-1.png) no-repeat');
			$('#video').removeClass();
			$('video').removeClass();
			$('#control').removeClass();
			$('#progressbar').css('width','560px');
			$('#time').css('margin-left','560px');
			$('#input').css('width','383px');
			$('#send').css('margin-left','580px');
		}else{
			$(this).css('background','url(img/icon/9-2.png) no-repeat');
			$('#video').addClass('wide');
			$('video').addClass('wide');
			$('#control').addClass('wide');
			$('#progressbar').css('width','880px');
			$('#time').css('margin-left','880px');
			$('#input').css('width','703px');
			$('#send').css('margin-left','900px');
		}
		iswide=1-iswide;
	})

	//__________Full Screen__________
	$('#fullscreen').click(function(){
		$('video')[0].webkitRequestFullScreen();
	})

	//__________Switch__________
	$('#switch').click(function(){
		if(ison) $(this).css('background','url(img/icon/8-7.png) no-repeat')
		else $(this).css('background','url(img/icon/1-8.png) no-repeat');
		ison=1-ison;
	})
	//__________Mode__________

	//__________Send Flying Comments__________

})
