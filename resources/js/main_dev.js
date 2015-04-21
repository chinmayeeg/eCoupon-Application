$(window).load(function(){
	var couponSystem = window.couponSystem || {};

	couponSystem = (function (global, $) {

		var eventType = (function () {
			return !!('ontouchstart' in window);
		}()) ? "tap" : "click";
		var listTopGutter=10,categoryHeaderHt=5;
		var aniSupport = false,disableResize=false,isSamsungTab=false,spacer=15;
		
		global.init = function () {
			$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
			if($(window).width()>=768){
				categoryHeaderHt = $(".couponCategoryGroup:first .categoryHeader").outerHeight();
			}
			if(eventType=="tap"){
				spacer=-25;
			}
			this.listings.init();
			this.menuList.init();
			this.resizeAndScroll.init();
			this.lazyLoading.init();
			aniSupport = this.generic.checkAnimationSupport();
			isSamsungTab = this.generic.checkSamsungTab();
			if(isSamsungTab){
				setTimeout(function(){
					$(".couponCategoryGroup:first .categoryHeader").css({'padding-top':'20px'});
					$(window).scrollTop(50+listTopGutter);
					global.resizeAndScroll.refreshScrollSpy();
				},1000);
			}
		};
		
		global.menuList = {
			init: function(){
				$(window).scrollTop(categoryHeaderHt+listTopGutter);
				$(".couponCategoryGroup:last").css({'min-height':($(window).height()-$(".header").outerHeight()/2-spacer)});
				$(".couponCategoryGroup:lt(1)").addClass("selectedCategory");
				this.pull = $('#pull');
				this.menu = $('.navLinks');
				this.enableMenuLinks();
				this.enablePull();
			},
			enableMenuLinks: function(){
				$(".navLinks a, .navLinks li").off(eventType);
				$(".navLinks a, .navLinks li").on(eventType,function(e){
					e.preventDefault();
					e.stopPropagation();
					$("li").attr("class","");
					var curTarget = $(this).attr("href") ? $(this) : $("a",$(this));
					var target = curTarget.attr("href").replace("#","");
					$('body').data('allowScrollSpy','0');
					$(window).scrollTop($("#"+target).offset().top-$(".couponList").offset().top+categoryHeaderHt+listTopGutter);
					$(".selectedCategory").removeClass('selectedCategory');
					$("#"+target).addClass('selectedCategory');
					global.lazyLoading.loadNextSet($("#"+target));
					$('body').data('allowScrollSpy','1');
					curTarget.parent('li').addClass('active');
					return false;
				});
			},
			enablePull: function(){
				var that = this;
				this.pull.off(eventType);
				this.pull.on(eventType, function(e) {
					e.preventDefault();
					e.stopPropagation();
					that.menu.slideToggle({
						duration: 'normal', step: function(){
							$(".spacer").height($(".header").outerHeight()+listTopGutter*4);
							$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
						},
						complete: function(){
							$(".spacer").height($(".header").outerHeight()+listTopGutter*4);
							$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
							global.resizeAndScroll.refreshScrollSpy();
						}
					});
					$('.header').on(eventType, function(e) {
						e.stopPropagation();
						that.menu.slideUp({
							duration: 'fast', step: function(){
								$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
								$(".spacer").height($(".header").outerHeight()+listTopGutter*4);
							},
							complete: function(){
								$(".spacer").height($(".header").outerHeight()+listTopGutter*4);
								$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
							}
						});
					});
					return false;
				});
			},
			checkAndClosePull: function(callback){
				if(this.pull.is(':visible')){
					this.menu.slideUp({
						duration: 'fast', step: function(){
							$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
							$(".spacer").height($(".header").outerHeight()+listTopGutter*4);
						},
						complete: function(){
							$(".spacer").height($(".header").outerHeight()+listTopGutter*4);
							$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
							if(callback=='setCouponDetails') {
								global.details.setCouponDetails();
								global.modal.setModal(".coupon");
							}
						}
					});
					return true;
				}
				else{
					if(callback=='setCouponDetails') {
						global.details.setCouponDetails();
						global.modal.setModal(".coupon");
					}return true;
				}
			}
		};

		global.listings = {
			config: function () {
				this.categoryCouponData = {};
				this.menuTmpl = $('#cat-listings').html();
				this.couponTmpl = $('#coupon-listings').html();
				this.elMenu = $("#navList");
				this.elCoupons = $(".coupons");
			},
			init: function () {
				this.config();
				this.initDetails();
			},
			initDetails: function(){
				
				$(".activateCoupon").off(eventType);
				$(".activateCoupon").on(eventType, function(e) {
					e.preventDefault();
					e.stopPropagation();
				//	$(this).css({"opacity":"0","filter":"alpha(opacity=0) !important"});
			//	alert($(this).data("processing"));
				//	if($(this).data("processing")!="true"){
						$(this).data("processing",'true');
						$(this).parents(".couponList .coupon").data("processing",'true');
						global.activateCoupon.processActivateRequest($(this).parents(".coupon"));
				//	}
					return false;
				});
				$(".couponList .coupon").off(eventType);
				$(".couponList .coupon").on(eventType, function(e) {
					e.preventDefault();
					e.stopPropagation();
					var baseObj = $(e.currentTarget).hasClass("coupon") ? $(e.currentTarget) : $(e.currentTarget).parents(".coupon");
					if((baseObj.data("processing")!='true'&&!baseObj.hasClass('placeHolder'))||baseObj.hasClass('activeCpn')){
							$('body').data('allowScrollSpy','0');
							$(this).addClass("popupSrc");
							global.menuList.checkAndClosePull('setCouponDetails');
					}
					return false;
				});
			}
		};
		
		global.modal = {
			initModal:function(windowObj){
				this.setPopupPosition('open',windowObj);
				this.adjustPopup('modal',windowObj);
				this.enableArrows();
			},
			closeModal: function(){
			},
			adjustPopup: function(callerMethod){
				disableResize=true;
				$(".header").css({'z-index':2});
				var curTop = parseInt($('#modal').css('top'));
				var popupHt = ($(".modalWrapper .couponInner").outerHeight() <= 0 )? $('#modal').outerHeight() : $(".modalWrapper .couponInner").outerHeight();
				if(popupHt+curTop <= $(window).height()){
					var x = $(document).scrollLeft(),
						y = $(document).scrollTop();
					if(callerMethod!='resize'){
						$(".data").data("xPos",x);
						$(".data").data("yPos",y);
					}
					$(".data").css("overflow","hidden");
					var newScrollTop = y == 0 ? $(".data").data("yPos") : y;
					$(".reveal-modal-bg").height($(window).height());
					$(document).height($(window).height());
					$('body').height($(window).height());
					$(".data").height($(window).height());
					$(".data").scrollTop(newScrollTop);
					$('body').css({'overflow':'hidden'});
					window.scrollTo( 0, 0 );
				}else {
					popupHt = popupHt+curTop+curTop/2;
					var x = $(document).scrollLeft(),
						y = $(document).scrollTop();
					if(callerMethod!='resize'){
						$(".data").data("orgHt",$(".data").height());
						$(".data").data("xPos",x);
						$(".data").data("yPos",y);
					}
					$('body').removeAttr("style");
					var newScrollTop = y == 0 ? $(".data").data("yPos") : y;
					$('.data').css({'overflow':'hidden', height:popupHt});
					$(".data").scrollTop(newScrollTop);
					$(document).height(popupHt);
					$('body').height(popupHt);
					$(".reveal-modal-bg").height(popupHt);
					window.scrollTo( 0, 0 );
				}
				disableResize=false;
			},
			setPopupPosition: function(callerMethod,windowObj){
				var curLeft = $('.wrapper').offset().left+(($(window).width()-$('.coupon',$('#modal')).width())/2);
				var curTop = $(".header").outerHeight()+20;
				$("#modal").css({left:  curLeft + "px", top:  curTop + "px"});
				$(".reveal-modal-bg").height($(".data").outerHeight());
			},
			enableArrows: function(){
				$(document).on('keydown',function(e) {
				var k = e.keyCode;
				if(k >= 37 && k <= 40) {
					return false;
				}
			});
			},
			disableArrows: function(){
				$(document).off('keydown');
			},
			setModal: function(windowObj){
				var that = this;
				$("#popupCouponId").val("");
				$("#modal .modalWrapper").children(':not('+windowObj+')').hide();
				$("#modal .modalWrapper").children(windowObj).removeAttr('style');
				that.initModal(windowObj);
				var animationSpeed = 100,
					callBkAni = 125;
				if(eventType=="click" && $(window).width()<=350){
					animationSpeed=callBkAni=0;
				}
				var animationType = 'fade';
				if(!Modernizr.canvas)
					animationType='none';
				$("#modal").reveal({ 
					animation: animationType,
					animationspeed: animationSpeed,
					closeonbackgroundclick: true,
					dismissmodalclass: 'closePopup',
					closeCallBack: function(){
						disableResize=true;
						$('body').data('allowScrollSpy','1');
						setTimeout(function(){that.resetBrowserScroll();},callBkAni);
					}
				});
			},
			resetBrowserScroll: function(){
				$(".data").removeAttr("style");
				$('body').removeAttr("style");
				$(".data").scrollTop(0);
				window.scrollTo($(".data").data("xPos"),$('.data').data("yPos"));
				$('#modal').hide();
				var baseCpn = "#"+$("#popupCouponId").val();
				if($("#popupCouponId").val()!=""){
					$(baseCpn+" .basicInfo").after($(".hideActivatedCoupon .activatedCoupon").clone());
					$(".productName span",$(baseCpn+" .activatedCoupon")).html($(".couponInfo span",$(baseCpn)).html());
					$(baseCpn+" .activatedMsg").removeClass('hide');
					$(baseCpn+" .activatedCoupon").addClass('displayThis');
					$(baseCpn).addClass("activeCpn");
					$(".popupSrc .basicInfo").fadeOut(0,function(){
						$(".popupSrc .activatedCoupon").fadeIn(0,function(){
							$('.popupSrc').addClass("slideUp");
							$(this).removeClass("hide");
							$('.popupSrc').removeClass("popupSrc");
							$('#modal .coupon').removeClass("active");
							global.resizeAndScroll.refreshScrollSpy();
						});
					});
				}else {
					$(".popupSrc").removeClass("popupSrc");
				}
				this.disableArrows();
				disableResize=false;
			}
		};

		global.activateCoupon = {
			activationSrc:'',
			processActivateRequest: function(that){
				if($("#loginStatus").val()==='true'){
					var activateSrc = 'list'; 
					if($(that).parents('.modalWrapper').length>0){
						activateSrc = 'details';
						$('.popupSrc').addClass("aCoupon");
						that = $('.popupSrc');
					}
					else {
						$(that).parents('.coupon').addClass("aCoupon");
					}
					this.saveCoupon(activateSrc,that);
				}else {
					$(".activateCoupon",that).removeData("processing");
					that.removeData("processing");
					$(".activateCoupon",that).css({"opacity":"1","filter":"alpha(opacity=100) !important"});
				}
			},
			saveCoupon: function(activationSrc,couponObj){
				var that = this;
				this.activationSrc = activationSrc;
				var couponForm = $('form',couponObj),
					url = couponForm.attr("action"),
					data = couponForm.serialize();
				if(url!=""){
				/*	$.ajax({
					  type: "POST",
					  url: url,
					  data: data,
					  dataType: 'JSON'
					}).success(function(res) {
						that.success(res,activationSrc,url);
						$(".activateCoupon", couponObj).removeData("processing");
						$(".modalWrapper .activateCoupon").removeData("processing");
						couponObj.data("processing",'false');
						$(".activeCpn .activateCoupon").hide();
					}).error(function(event,jqxhr,settings) {
						that.failure(couponObj);
						couponForm.attr("action",url);
						$(".activateCoupon", couponObj).removeData("processing");
						$(".modalWrapper .activateCoupon").removeData("processing");
						couponObj.data("processing",'false');
					});*/
				}
				var res = {'statusCode': '00', 'couponId': $("input[name='couponID']",couponObj).val()};
				that.success(res,activationSrc,url);
				$(".activateCoupon", couponObj).removeData("processing");
				$(".modalWrapper .activateCoupon").removeData("processing");
				couponObj.data("processing",'false');
				$(".activeCpn .activateCoupon").hide();
			},
			success: function(response,activationSrc,url){
				if(response.statusCode == '00'){
					var sourceCpn = "#"+response.couponId;
					if(activationSrc == 'list'){
						var jsAnimationDuration = 50;
						if(!aniSupport){
							jsAnimationDuration = 300;
						}
						$(sourceCpn+" .basicInfo").after($(".hideActivatedCoupon .activatedCoupon").clone());
						$(".productName span",$(sourceCpn+" .activatedCoupon")).html($(".couponInfo span",$(sourceCpn)).html());
						$(sourceCpn+" .activatedMsg").show();
						if(!aniSupport){
							$(sourceCpn+" .socialShare").addClass("active").show();
							$(sourceCpn+" .activatedMsg").removeClass('hide');
							$(sourceCpn+" .activatedCpnInfo").addClass("active");
						}
						if($(window).width()>=768 || !aniSupport){
							$(sourceCpn+" .basicInfo").fadeOut(jsAnimationDuration,function(){
								$(sourceCpn+" .couponInner").addClass("bigViewAnimation");
								$(sourceCpn).addClass("slideUp");
								$(sourceCpn+" .activatedCoupon").fadeIn(jsAnimationDuration,function(){
									$(this).removeClass("hide");
									if(!aniSupport)
										$(sourceCpn).addClass("activeCpn");
									if(aniSupport){
										$(sourceCpn+" .socialShare").addClass("active");
										$(sourceCpn+" .activatedCpnInfo").addClass("active");
									}
									global.resizeAndScroll.refreshScrollSpy();
								});
								$(sourceCpn).addClass("activeCpn");
								if($(window).width()<768){
									$(sourceCpn+" .activatedCoupon").css({top:0});
									$(".couponCategoryGroup:last").css({'min-height':$(window).height()-$(".header").outerHeight()+listTopGutter*2});
								}
							});
						}else {
							$('body').data('allowScrollSpy','0');
							$(sourceCpn).addClass("slideUp");
							var isOldAndroid = global.generic.getAndroidOSVersion();
							$(sourceCpn).one('webkitTransitionEnd transitionend MSTransitionEnd transitionend',function(){
								$(sourceCpn+" .activatedCoupon").show();
								if(isOldAndroid){
									$(".basicInfo",$(sourceCpn)).fadeOut(100);
									$(".activatedCoupon",$(sourceCpn)).delay(100).fadeIn(100).addClass("displayThis");
									$(sourceCpn).addClass("activeCpn");
									$('body').data('allowScrollSpy','1');
								}else {
									$(sourceCpn+" .couponInner").addClass("slideUpInner");
									$(sourceCpn+" .couponInner").one('webkitTransitionEnd transitionend MSTransitionEnd transitionend',function(){
										$(sourceCpn).addClass("activeCpn");
										$('body').data('allowScrollSpy','1');
									});
								}
								$(".couponCategoryGroup:last").css({'min-height':($(window).height()-$(".header").outerHeight()/2-spacer)});
								global.resizeAndScroll.refreshScrollSpy();
							});
						}
					}else {
						$("#popupCouponId").val(response.couponId);
						$("#modal .activateCoupon").hide();
						$("#modal .coupon").addClass("active");
					}
					$(".aCoupon").removeClass("aCoupon");
				}else if(response.statusCode == '01'){
					var sourceCpn = $("#"+response.couponId);
					$('form',sourceCpn).attr("action",url);
					this.failure(sourceCpn);
				}
			},
			failure: function(sourceCpn){
				$(".activateCoupon",sourceCpn).removeAttr("style");
				$(".aCoupon").removeClass("aCoupon");
				$(".popupSrc").removeClass("popupSrc");
				alert('Error has occurred. Please try again.');
			}
		};

		global.details = {
			setCouponDetails: function(){
				var that = $('.popupSrc');
				if(!that.hasClass("activeCpn")){
					$(".activateCoupon").removeAttr("style");
					$(".activateCoupon").removeData("processing");
					$(".activeCpn .socialShare").addClass("active");
					$('#modal .baseCouponData').html("");
					$('#modal .activateCoupon').show();
					$(".modalWrapper .activatedMsg *").removeAttr("style");
					$(".modalWrapper .coupon").removeClass('added active');
				}else {
					$(".modalWrapper .activateCoupon").hide();
					$(".modalWrapper .coupon").addClass('added');
					$(".modalWrapper .activatedMsg *").css({'opacity':1,"filter":"alpha(opacity=100) !important"});
					$(".modalWrapper .activatedMsg img").css({'height':'39px','width':'40px'});
				}
				if($(".markt_one",$(that)).html()=="")
					$('#modal .couponFooter').hide();
				else
					$('#modal .couponFooter').html($(".markt_one",$(that)).html()).show();
				$('#modal .productTitle').html($(".couponInfo span",that).html());
				$('#modal .couponValidity').html($(".daysLeft",that).val());
				if($(".couponInfo p",that).html()=="")
					$('#modal .couponInfo p').hide();
				else
					$('#modal .couponInfo p').html($(".couponInfo p",that).html()).show();
				$('#modal .productTitle').html($(".couponInfo span",that).html());
				if($(".cvsLink",that).html()=="")
					$('#modal .spLogos').hide();
				else
					$('#modal .spLogos').html($(".cvsLink",that).html()).show();
				return;
			}
		};
		
		global.resizeAndScroll = {
			init: function(){
				this.initScroll();
				if(eventType=="click")
					this.initResize();
				else 
					this.initOrientationChange();
				this.initScrollSpy();
			},
			initScroll: function(){
				var scroll=0;
				$(window).off('scroll');
				$(window).on('scroll',function(e){
					if (scroll>0){
						setTimeout(function(){
							$(".selectedCategory").removeClass('selectedCategory');
							var curCategory = $("a",$(".navLinks li.active")).attr('href');
							$(curCategory).addClass('selectedCategory');
							global.lazyLoading.loadNextSet($(curCategory));
						},100);
						if($('#modal').is(':visible')){
							global.modal.setPopupPosition('');
						}
						if(scroll==1){
							$(window).scrollTop(categoryHeaderHt+listTopGutter);
						}
					}
					scroll++;
					return false;
				});
			},
			initResize: function(){
				var that = this;
				var resizeTimeout=0;
				$(window).on('resize',function(){
					if(!disableResize){
						clearTimeout(resizeTimeout);
						resizeTimeout = setTimeout(function(){
							if((global.menuList.pull).is(':hidden')){
								$(".navLinks").removeAttr("style");
								$(".spacer").removeAttr("style");
							}
							$(".couponCategoryGroup:last").css({'min-height':($(window).height()-$(".header").outerHeight()/2-spacer)});
							$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
							if($('#modal').is(':visible')){
								global.modal.setPopupPosition('resize');
								global.modal.adjustPopup('resize');
							}
							categoryHeaderHt=5;
							if($(window).width()>=768){
								categoryHeaderHt = $(".couponCategoryGroup:first .categoryHeader").outerHeight();
							}
							global.resizeAndScroll.refreshScrollSpy();
							return false;
						}, 100);
						}
				});
			},
			initOrientationChange: function(){
				var that = this;
				var resizeTimeout=0;
				var delay=1500;
				$(window).on('orientationchange',function(){
					clearTimeout(resizeTimeout);
					$(".couponCategoryGroup:last").removeAttr("style");
					resizeTimeout = setTimeout(function(){
						if((global.menuList.pull).is(':hidden')){
							$(".navLinks").removeAttr("style");
							$(".spacer").removeAttr("style");
						}
						$(".couponList").css({'top':$(".header").outerHeight()+listTopGutter});
						if($('#modal').is(':visible')){
							global.modal.setPopupPosition('resize');
							global.modal.adjustPopup('resize');
						}
						categoryHeaderHt=5;
						if($(window).width()>=768){
							categoryHeaderHt = $(".couponCategoryGroup:first .categoryHeader").outerHeight();
						}
						global.generic.samsungFix();
						$(".couponCategoryGroup:last").css({'min-height':($(window).height()-$(".header").outerHeight()/2-spacer)});
						global.resizeAndScroll.refreshScrollSpy();
						return false;
					}, delay);
				});
			},
			refreshScrollSpy: function(){
				$('[data-spy="scroll"]').each(function () {
				  var $spy = $(this);
				  $spy.data('allowScrollSpy','1');
				  $spy.scrollspy('refresh');
				  $spy.scrollspy('process');
				});
			},
			initScrollSpy: function(){
				$('[data-spy="scroll"]').each(function () {
				  var $spy = $(this);
				  $spy.data('allowScrollSpy','1');
				  spyObj = $spy.scrollspy($spy.data());
				});
			}
		};

		global.generic = {
			samsungFix: function(){
				if( /android/i.test(navigator.userAgent.toLowerCase()) ) {
				   setTimeout(function(){
					   var newWidth = $(window).outerWidth() ? $(window).outerWidth() : $(window).width();
					   $(".header").width(newWidth);
					   $(".wrapper").width(newWidth);
					   $(".header .headerShadow").width(newWidth);
				   },200);
				}
			},
			getAndroidOSVersion: function(){
				var ua = navigator.userAgent;
				if( ua.indexOf("Android") >= 0 )
				{
				  var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8)); 
				  if (androidversion < 4.0)
				  {
					  return true;
				  }
				}
				return false;
			},
			checkAnimationSupport: function(){
				var b = document.body || document.documentElement;
				var s = b.style;
				var p = 'transition';
				if(typeof s[p] == 'string') {return true; }

				// Tests for vendor specific prop
				v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms',''],
				p = p.charAt(0).toUpperCase() + p.substr(1);
				for(var i=0; i<v.length; i++) {
				  if(typeof s[v[i] + p] == 'string') { return true; }
				}
				return false;
			},
			checkSamsungTab: function(){
				if( /android/i.test(navigator.userAgent.toLowerCase()) ) {
					if($(window).width()>=768){
						return true;
					}
				}
				return false;
			}
		};
		
		global.lazyLoading = {
			init: function(){
				$("img.lazy").show();
				$("img.lazy").lazyload({ 
					failure_limit : 10,
					event : "sporty",
					load : function(){
						$(this).css({'width':'100%'});
					}
				});
				$('img.lazy',$($(".navLinks a:first").attr("href"))).trigger('sporty');
			},
			loadNextSet: function(target){
				$('img.lazy',target).trigger('sporty');
				var that = target;
				while(that.next().position() && (that.next().position().top <= $(window).scrollTop()+$(window).height())){
					that = that.next();
					$('img.lazy',that).trigger('sporty');
				}
			}
		};
		return global;
	}(couponSystem, jQuery));

	$(function () {
		'use strict';
		couponSystem.init();
	});
});