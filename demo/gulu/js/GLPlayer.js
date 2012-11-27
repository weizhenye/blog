$('#upload').change(function(){
//==========Get Video==========
	var	file=$(this)[0].files[0],
		fileType='',
		url,i=0;

	while(i++<3) fileType=file.name[file.name.length-i].toLowerCase()+fileType;
	if(fileType!='mp4'&&fileType!='mkv'&&fileType!='mov'&&fileType!='ogg')
		return alert('仅支持mp4,mkv,mov和ogg格式');
	window.createObjectURL
	?	url=window.createObjectURL(file)
	:	window.createBlobURL
		?	url=window.createBlobURL(file)
		:	window.URL && window.URL.createObjectURL
			?	url=window.URL.createObjectURL(file)
			:	window.webkitURL && window.webkitURL.createObjectURL
				?	url=window.webkitURL.createObjectURL(file)
				:	url=undefined;
	$('video').attr('src',url).css({'position':'absolute','background':'black'});
	$('#info').text(file.name);

//==========Auto get video title,episode and subtitle group==========
	var	subGroup='',
		videoTitle='',
		episode='',
		size=0,
		isGet=1;
		i=1;

	if(file.name[i-1]=='['){
		while(file.name[i]!=']') subGroup+=file.name[i++];
		i+=2;
		if(file.name[i-1]=='['){
			while(file.name[i]!=']') videoTitle+=file.name[i++];
			i+=2;
			if(file.name[i-1]=='['){
				while(file.name[i]!=']') episode+=file.name[i++];
			}else isGet=0
		}else isGet=0
	}else isGet=0;//English word or number should be half size,or direct get the width
	//if(subGroup and videoTitle and episode NOT in MySQL) isGet=0;
	if(!isGet){//Get info from users' input
		$('#episode').text('⑨').css('font-size',30);
		$('#subGroup').text('才不是因为我笨').css('font-size',30);
		$('#videoTitle').text('自动匹配弹幕失败_(:з」∠)_').css('font-size',30);

		$('#box').slideDown(300).find('span').click(function(){
			$('#box').slideUp(300);
		});

		/*
		videoTitle=input('videoTitle');
		episode=select('episode');
		subGroup=select('subGroup');
		isGet=1;
		*/
	}
	if(isGet){
		//load flying comments 
		$('#box').css('display','none');
		$('#videoTitle').text(videoTitle).css('font-size',Math.min(360/videoTitle.length*1.8,30));
		$('#subGroup').text(subGroup).css('font-size',Math.min(220/subGroup.length*1.8,30));
		$('#episode').text(episode).css('font-size',Math.min(60/episode.length*1.8,30));
	}
//==========Controls==========
	var	pointMinute=0,
		pointSecond=0,
		isPlay=0,
		isMute=0,
		tmpVolume=1,
		isWide=0,
		isOn=1,
		modeOn=0;

	//__________Progress Bar__________
	$('#progressBar').click(function(e){
		if($('video')[0].currentTime){
			$('#progress').css('width',e.offsetX+'px');
			isWide	?	$('video')[0].currentTime=e.offsetX*$('video')[0].duration/880
					:	$('video')[0].currentTime=e.offsetX*$('video')[0].duration/560;
		}
	}).mousemove(function(e){
		isWide	?	pointMinute=Math.floor(e.offsetX*$('video')[0].duration/880/60)
				:	pointMinute=Math.floor(e.offsetX*$('video')[0].duration/560/60);
		isWide	?	pointSecond=Math.floor(e.offsetX*$('video')[0].duration/880%60)
				:	pointSecond=Math.floor(e.offsetX*$('video')[0].duration/560%60);
		if(pointMinute<0) pointMinute=0;
		if(pointSecond<0) pointSecond=0;
		if(pointMinute<10) pointMinute='0'+pointMinute;
		if(pointSecond<10) pointSecond='0'+pointSecond;
		$(this).attr('title',pointMinute+':'+pointSecond);
	})

	//__________Time__________
	setInterval(function(){
		var	progressWidth,
			minute=Math.floor($('video')[0].currentTime/60),
			second=Math.floor($('video')[0].currentTime%60),
			totleMinute=Math.floor($('video')[0].duration/60),
			totleSecond=Math.floor($('video')[0].duration%60);

		isWide	?	progressWidth=$('video')[0].currentTime*880/$('video')[0].duration
				:	progressWidth=$('video')[0].currentTime*560/$('video')[0].duration;
		$('#progress').css('width',progressWidth+'px');
		if(minute<0) minute=0;
		if(second<0) second=0;
		if(minute<10) minute='0'+minute;
		if(second<10) second='0'+second;
		if(totleMinute<10) totleMinute='0'+totleMinute;
		if(totleSecond<10) totleSecond='0'+totleSecond;
		if(!totleMinute) totleMinute='00';
		if(!totleSecond) totleSecond='00';
		$('#time').text(minute+':'+second+'/'+totleMinute+':'+totleSecond);
		if($('video')[0].ended) location.reload();
	})

	//__________Play & Pause__________
	function playButton(){
		if(isPlay++%2){
			$('#play').css('background-position','0 0');
			$('video')[0].pause();
		}else{
			$('#play').css('background-position','-32px 0');
			$('video')[0].play();
		}
	}
	$('#play').click(playButton);
	$('video').click(playButton);

	//__________Volume__________
	function volumeIcon(){
		tmpVolume>0.7
		?	$('#volume').css('background-position','-192px 0')
		:	tmpVolume>0.4
			?	$('#volume').css('background-position','-160px 0')
			:	tmpVolume>0.1
				?	$('#volume').css('background-position','-128px 0')
				:	$('#volume').css('background-position','-96px 0')
	}
	$('#volume').mouseenter(function(){
		$('#volumeBarNow').show().mouseleave(function(){
			$(this).hide();
		});
		$('#volumeBar').click(function(e){
			volumeIcon();
			$('video')[0].volume=tmpVolume=1-e.offsetY/40;
			$('#volumeBarNow').css('height',e.offsetY);
			isMute=0;
		})
	}).click(function(){
		if(isMute++%2){
			volumeIcon();
			$('video')[0].volume=tmpVolume;
		}else{
			$(this).css('background-position','-64px 0');
			tmpVolume=$('video')[0].volume;
			$('video')[0].volume=0;
		}
	})

	//__________wide Screen__________
	$('#wideScreen').click(function(){
		if(isWide++%2){
			$(this).css('background-position','-224px 0');
			$('#video').removeClass();
			$('video').removeClass();
			$('#control').removeClass();
			$('#progressBar').css('width','560px');
			$('#time').css('margin-left','560px');
			$('#input').css('width','383px');
			$('#send').css('margin-left','580px');
		}else{
			$(this).css('background-position','-256px 0');
			$('#video').addClass('wide');
			$('video').addClass('wide');
			$('#control').addClass('wide');
			$('#progressBar').css('width','880px');
			$('#time').css('margin-left','880px');
			$('#input').css('width','703px');
			$('#send').css('margin-left','900px');
		}
	})

	//__________Full Screen__________
	$('#fullScreen').click(function(){
		$('video')[0].webkitRequestFullScreen();
	})

	//__________Switch__________
	$('#switch').click(function(){
		isOn++%2	?	$(this).css('background-position','-352px 0')
					:	$(this).css('background-position','-320px 0');
	})

	//__________Mode__________
	$('#mode').click(function(){
		modeOn++%2	?	$(this).css('background-position','-384px 0')
					:	$(this).css('background-position','-416px 0');
	})

	//__________Send Flying Comments__________

})
