$('#upload').change(function(){
//==========Get Video==========
	var	file=$(this)[0].files[0],
		fileType='',
		url,
		i=0;

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
	}else isGet=0;
	//if(subGroup and videoTitle and episode NOT in MySQL) isGet=0;
	if(!isGet){
		$('#episode').text('⑨');
		$('#subGroup').text('才不是因为我笨');
		$('#videoTitle').text('自动匹配弹幕失败_(:з」∠)_');

		$('#box').slideDown(300).find('span').click(function(){
			$('#box').slideUp(300);
		});

		$('#box button').click(function(){
			videoTitle=$('#boxVideoTitle input')[0].value;
			episode=$('#boxEpisode select')[0].value;
			subGroup=$('#boxSubGroup select')[0].value;
			if(videoTitle&&episode&&subGroup) showTitle();
		})
	}
	if(isGet) showTitle();
	function showTitle()
	{
		//load flying comments
		$('#box').css('display','none');
		$('#danmu').css('z-index',0);
		$('#videoTitle').text(videoTitle).css('font-size',Math.min(350*16/textWidth(videoTitle),30));
		$('#subGroup').text(subGroup).css('font-size',Math.min(210*16/textWidth(subGroup),30));
		$('#episode').text(episode).css('font-size',Math.min(50*16/textWidth(episode),30));
	}

//==========Controls==========
	var	pointMinute=0,
		pointSecond=0,
		isPlay=0,
		tmpPlay=0,
		isMute=0,
		tmpVolume=1,
		isWide=0,
		isFull=0,
		tmpFull=0,
		isOn=1,
		modeOn=0,
		text=0,
		channel=0,
		fontSize=24;

	//__________Progress Bar__________
	$('#progressBar').click(function(e){
		if($('video')[0].currentTime){
			$('#progress').css('width',e.offsetX);
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
		$('#progress').css('width',progressWidth);
		if(minute<0) minute=0;
		if(second<0) second=0;
		if(minute<10) minute='0'+minute;
		if(second<10) second='0'+second;
		if(totleMinute<10) totleMinute='0'+totleMinute;
		if(totleSecond<10) totleSecond='0'+totleSecond;
		if(!totleMinute) totleMinute='00';
		if(!totleSecond) totleSecond='00';
		$('#time').text(minute+':'+second+'/'+totleMinute+':'+totleSecond);
		if(document.webkitIsFullScreen!=tmpFull){
			tmpFull=document.webkitIsFullScreen;
			document.webkitIsFullScreen
			?	enterFull()
			:	quitFull();
			if(isWide) enterWide();
		}
		if($('video')[0].ended) location.reload();
	})
	//__________Play & Pause__________
	$('#play').click(playButton);
	$('video').click(playButton);
	$('#danmu').click(playButton);
	function playButton(){
		if(isPlay){
			$('#play').css('background-position',0);
			$('video')[0].pause();
			$('pre').each(function(){
				$('pre').stop();//NOT WORK
			});
		}else{
			$('#play').css('background-position',-32);
			$('video')[0].play();
			launchDanmu();
		}
		isPlay=1-isPlay;
	}

	//__________Volume__________
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
		if(isMute){
			volumeIcon();
			$('video')[0].volume=tmpVolume;
		}else{
			$(this).css('background-position',-64);
			tmpVolume=$('video')[0].volume;
			$('video')[0].volume=0;
		}
		isMute=1-isMute;
	})
	function volumeIcon(){
		tmpVolume>0.7
		?	$('#volume').css('background-position',-192)
		:	tmpVolume>0.4
			?	$('#volume').css('background-position',-160)
			:	tmpVolume>0.1
				?	$('#volume').css('background-position',-128)
				:	$('#volume').css('background-position',-96)
	}

	//__________wide Screen__________
	$('#wideScreen').click(function(){
		isWide	?	quitWide()
				:	enterWide();
		isWide=1-isWide;
	})
	function enterWide(){
		document.webkitCancelFullScreen();
		$('#fullScreen').css('background-position',-288);
		$('#wideScreen').css('background-position',-256);
		$('#video').removeClass().addClass('wide');
		$('video').removeClass().addClass('wide');
		$('#danmu').removeClass().addClass('wide');
		$('#control').css({'width':960,'left':'auto','bottom':'auto'})
		$('#progressBar').css('width',880);
		$('#time').css('margin-left',880);
		$('#tucao').css('width',703);
		$('#send').css('margin-left',900);
	}
	function quitWide(){
		$('#wideScreen').css('background-position',-224);
		$('#video').removeClass().addClass('normal');
		$('video').removeClass().addClass('normal');
		$('#danmu').removeClass().addClass('normal');
		$('#control').css('width',640);
		$('#progressBar').css('width',560);
		$('#time').css('margin-left',560);
		$('#tucao').css('width',383);
		$('#send').css('margin-left',580);
	}
	//__________Full Screen__________
	$('#fullScreen').click(function(){
		document.webkitIsFullScreen
		?	document.webkitCancelFullScreen()
		:	$('#videoAndControl')[0].webkitRequestFullScreen();
	})
	function enterFull(){
		isWide=0;
		$('#wideScreen').css('background-position',-224);
		$('#fullScreen').css('background-position',-320);
		$('#video').removeClass().addClass('full').css({
			'width':window.screen.width,
			'height':window.screen.height-40
		})
		$('video').removeClass().addClass('full').css({
			'width':window.screen.width,
			'height':window.screen.height-40
		})
		$('#danmu').removeClass().addClass('full').css({
			'width':window.screen.width,
			'height':window.screen.height-40
		})
		$('#control').css({'width':window.screen.width,'bottom':0,'left':0})
		$('#progressBar').css('width',window.screen.width-80);
		$('#time').css('margin-left',window.screen.width-80);
		$('#tucao').css('width',window.screen.width-257);
		$('#send').css('margin-left',window.screen.width-60);
	}
	function quitFull(){
		$('#fullScreen').css('background-position',-288);
		$('#video').removeClass().addClass('normal');
		$('video').removeClass().addClass('normal');
		$('#danmu').removeClass().addClass('normal');
		$('#control').css({'width':640,'position':'static'});
		$('#progressBar').css('width',560);
		$('#time').css('margin-left',560);
		$('#tucao').css('width',383);
		$('#send').css('margin-left',580);
	}

	//__________Switch__________
	$('#switch').click(function(){
		isOn	?	$(this).css('background-position',-384)
				:	$(this).css('background-position',-352);
		isOn	?	$('#danmu').css('z-index',-233)
				:	$('#danmu').css('z-index',233);
		isOn=1-isOn;
	})

	//__________Mode__________
	$('#mode').click(function(){
		modeOn	?	$(this).css('background-position',-416)
				:	$(this).css('background-position',-448);
		modeOn=1-modeOn;
	})

	//__________Send Flying Comments__________
	$('#send').click(function(){
		var	text=$('#tucao')[0].value;

		//upload the text to MySQL
		$('#tucao')[0].value='';
		if(text) setDanmu(text,channel,fontSize,$('video').width(),$('video').height());
		if(isPlay) launchDanmu();
	})

//==========Functions==========
	function textWidth(text){
		var	tmp=$('<pre></pre>').text(text).appendTo('header').css({'font-size':fontSize,'display':'none'}),
			width=tmp.width();
		tmp.remove();
		return width;
	}
	function setDanmu(text,channel,fontSize,videoWidth,videoHeight){
		$('<pre></pre>').text(text).appendTo('#danmu').css({
			'display':'block',
			'position':'absolute',
			'margin-top':channel,
			'font-size':fontSize,
			'right':-textWidth(text),
		});
	}
	function launchDanmu(){
		var	v=0;
		$('pre').each(function(){
			v=( $('video').width() + textWidth( $(this).text() ) ) / 5120;
			$(this).animate(
				{right:$('video').width()},
				( textWidth( $(this).text() ) + $(this)[0].offsetLeft ) / v,
				'linear',function(){
					$(this).remove();
			})
		})
	}
})