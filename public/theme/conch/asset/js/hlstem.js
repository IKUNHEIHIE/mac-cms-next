var App = {
    // 浏览器环境信息检测
    browser: {
        url: document.URL,
        domain: document.domain,
        title: document.title,
        urlpath: document.location.pathname,
        language: (navigator.browserLanguage || navigator.language).toLowerCase(),
        
        // 检测 Canvas 支持
        canvas: function() {
            // [已移除反调试/控制台劫持混淆代码]
            return !!document.createElement("canvas").getContext;
        }(),
        
        // UserAgent 解析
        useragent: function() {
            // [已移除反调试/控制台劫持混淆代码]
            var ua = navigator.userAgent;
            return {
                mobile: !!ua.match(/AppleWebKit.*Mobile.*/),
                ios: !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
                android: -1 < ua.indexOf("Android") || -1 < ua.indexOf("Linux"),
                iPhone: -1 < ua.indexOf("iPhone") || -1 < ua.indexOf("Mac"),
                iPad: -1 < ua.indexOf("iPad"),
                trident: -1 < ua.indexOf("Trident"), // IE内核
                presto: -1 < ua.indexOf("Presto"), // opera内核
                webKit: -1 < ua.indexOf("AppleWebKit"), // 苹果、谷歌内核
                gecko: -1 < ua.indexOf("Gecko") && -1 === ua.indexOf("KHTML"), // 火狐内核
                weixin: -1 < ua.indexOf("MicroMessenger") // 是否微信
            };
        }()
    },

    // 移动端特定功能
    mobile: {
        // 分享弹窗控制
        share: function() {
            $(".open-share").click(function() {
                $(".am-share").addClass("am-modal-active");
                if ($(".sharebg").length > 0) {
                    $(".sharebg").addClass("sharebg-active");
                } else {
                    $("body").append('<div class="sharebg"></div>');
                    $(".sharebg").addClass("sharebg-active");
                }
                
                // 点击背景关闭
                $(".sharebg-active,.share_btn").click(function() {
                    $(".am-share").removeClass("am-modal-active");
                    setTimeout(function() {
                        $(".sharebg-active").removeClass("sharebg-active");
                        $(".sharebg").remove();
                    }, 300);
                });
            });
        },
        
        // 微信环境下插入“小说”链接
        xiaoshuo: function() {
            if (App.browser.useragent.weixin) {
                $("#xiao").after('<li><a rel="nofollow" href="https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzU4NTY2OTQ3Ng==&scene=126&bizpsid=0#wechat_redirect" target="_blank">小说</a></li>');
            } else {
                $("#xiao").after();
            }
        }
    },

    // 初始化 Swiper 轮播图
    swiper: function() {
        $.getScript(maccms.path + "/template/conch/asset/js/stem/swiper.min.js", function() {
            // 顶部大轮播
            var swiper1 = new Swiper(".banner-top", {
                autoplay: 5000,
                autoplayDisableOnInteraction: false,
                speed: 1000,
                loop: true,
                slidesPerView: 5,
                centeredSlides: true,
                mousewheelControl: true,
                prevButton: ".swiper-button-prev",
                nextButton: ".swiper-button-next",
                lazyLoading: true,
                lazyLoadingInPrevNext: true,
                runCallbacksOnInit: false,
                onInit: function() {
                    setTimeout(function() {
                        var bgUrl = $(".banner-top .swiper-slide-active a").css("backgroundImage").replace("url(", "").replace(")", "");
                        document.getElementById("bgimage").style.backgroundImage = "url(" + bgUrl + ")";
                    }, 1500);
                },
                onSlideChangeStart: function() {
                    var bgUrl = $(".banner-top .swiper-slide-active a").css("backgroundImage").replace("url(", "").replace(")", "");
                    document.getElementById("bgimage").style.backgroundImage = "url(" + bgUrl + ")";
                },
                breakpoints: {
                    1024: { slidesPerView: 4.6 },
                    820: { slidesPerView: 2.5 }
                }
            });

            // 另一种轮播样式
            var swiper2 = new Swiper(".banner-wtop", {
                autoplay: 5000,
                autoplayDisableOnInteraction: false,
                loop: true,
                prevButton: ".swiper-button-prev",
                nextButton: ".swiper-button-next",
                pagination: ".swiper-pagination",
                paginationClickable: true,
                onInit: function() {
                    setTimeout(function() {
                        $.adaptiveBackground.run();
                    }, 1500);
                }
            });

            // 文章页轮播
            var swiper3 = new Swiper(".art_banner", {
                autoplay: 5000,
                autoplayDisableOnInteraction: false,
                spaceBetween: 1,
                speed: 1000,
                slidesPerView: 1,
                loop: true,
                prevButton: ".swiper-button-prev",
                nextButton: ".swiper-button-next",
                pagination: ".swiper-pagination",
                paginationClickable: true,
                lazyLoading: true,
                lazyLoadingInPrevNext: true
            });
        });
    },

    // 菜单逻辑 (PC端悬浮，移动端点击)
    menu: function() {
        var width = $(window).width();
        if (width < 820) {
            // 移动端菜单
            $(".menu").click(function() {
                $("html,body").addClass("overhidden"); // 禁止背景滚动
                $(".all_menu").addClass("menu_block");
                $(".close_menu").click(function() {
                    $("html,body").removeClass("overhidden");
                    $(".all_menu").removeClass("menu_block");
                });
            });
        } else {
            // PC端菜单悬浮
            $(".head_menu_b").each(function(index) {
                $(this).hover(function() {
                    $(".all_menu").eq(index).show();
                }, function() {
                    $(".all_menu").eq(index).hide();
                });
            });
        }
    },

    // 滚动固定导航和广告
    fixed: function() {
        // 锚点平滑滚动
        if (window.location.hash) {
            var targetTop = $(window.location.hash).offset().top - 80;
            $("html,body").animate({ scrollTop: targetTop }, 300);
        }

        // 导航栏吸顶
        $(window).scroll(function() {
            if ($(this).scrollTop() >= 50) {
                $("#topnav,.listnow,.art_navlist").addClass("nav_fixed");
            } else {
                $("#topnav,.listnow,.art_navlist").removeClass("nav_fixed");
            }
        });

        // 右侧广告吸顶
        $(window).scroll(function() {
            if ($(this).scrollTop() >= 1200) {
                $(".ads_rbox").addClass("adfixed");
            } else {
                $(".ads_rbox").removeClass("adfixed");
            }
        });
    },

    // 搜索框交互
    Search: function() {
        $("input.form_control").focus(function() {
            $(".submit").addClass("search_btn");
        });
        $("input.form_control").blur(function() {
            $(".submit").removeClass("search_btn");
        });
    },

    // 移动端横向滚动条
    wrapper: function() {
        var width = $(window).width();
        if (width < 820) {
            $.getScript(maccms.path + "/template/conch/asset/js/stem/iscroll.js", function() {
                $(".wrapper").navbarscroll();
                $("#ik01").navbarscroll({ SelectName: ".ik-n-01" });
                $("#ik02").navbarscroll({ SelectName: ".ik-n-02" });
                $("#ik03").navbarscroll({ SelectName: ".ik-n-03" });
                $("#ik04").navbarscroll({ SelectName: ".ik-n-04" });
                $("#ik05").navbarscroll({ SelectName: ".ik-n-05" });
                $("#ik06").navbarscroll({ SelectName: ".ik-n-06" });
            });
        }
    },

    // 展开/收起
    flip: function() {
        $(".flip").click(function() {
            $(".panel").slideToggle("slow");
            $(".xs1").toggle();
            $(".xs2").toggle();
        });
    },

    // 关闭广告按钮
    closebtn: function() {
        $(".close_ads_btn").click(function() {
            $("#bottom_ads").remove();
            $(".foot").removeClass("foot_stem");
        });
        $(".close_tips").click(function() {
            $("#fd_tips").remove();
        });
    },

    // 短链接生成 (调用新浪API)
    shorturl: function() {
        var $short = $("#short");
        var $short2 = $("#short2");
        var apiUrl = "https://api.weibo.com/2/short_url/shorten.json";
        var appKey = $("#app_key").val();
        var shareUrl = $("#shareurl").val();
        var requestUrl;

        if (shareUrl == "") {
            requestUrl = apiUrl + "?source=" + appKey + "&url_long=" + encodeURIComponent(App.browser.url);
        } else {
            requestUrl = apiUrl + "?source=" + appKey + "&url_long=" + shareUrl + encodeURIComponent(App.browser.urlpath);
        }

        $.ajax({
            url: requestUrl,
            type: "GET",
            dataType: "jsonp",
            cache: false,
            success: function(response) {
                // 这里的 for 循环是原代码中的空循环，没有实际作用
                for (x in response.data.urls[0]) {}
                $short.append(response.data.urls[0].url_short);
                $short2.append(response.data.urls[0].url_short);
            }
        });
    },

    // 图片处理：懒加载和二维码
    images: {
        lazyload: function() {
            $.getScript(maccms.path + "/template/conch/asset/js/stem/jquery.lazyload.min.js", function() {
                $(".lazyload").lazyload({
                    effect: "fadeIn",
                    threshold: 200,
                    failurelimit: 20
                });
                
                var width = $(window).width();
                if (width < 820) {
                    // 移动端特殊容器懒加载
                    $(".list_scroll .vodlist_thumb").removeClass("lazyload").addClass("boxload");
                    $(".boxload").lazyload({
                        effect: "fadeIn",
                        threshold: 150,
                        failurelimit: 5,
                        container: $(".vodlist_sm,.vodlist_sh")
                    });
                }
            });
        },
        qrcode: function() {
            $.getScript(maccms.path + "/template/conch/asset/js/stem/jquery.qrcode.min.js", function() {
                $(".cans").qrcode({
                    width: 120,
                    height: 120,
                    text: encodeURI(App.browser.url)
                });
                
                // 将 Canvas 转换为 Image
                function canvasToImage(canvas) {
                    var img = new Image();
                    img.src = canvas.toDataURL("image/png");
                    return img;
                }
                
                var canvas = $("canvas")[0];
                var img = canvasToImage(canvas);
                $(".qrcode").append(img);
            });
        }
    },

    // 回到顶部
    scrolltop: function() {
        var $window = $(window);
        var $backTop = $("a.backtop");
        
        $window.scroll(function() {
            if ($(this).scrollTop() > 500) {
                $backTop.css("display", "block");
            } else {
                $backTop.css("display", "none");
            }
        });
        
        $backTop.on("click", function() {
            $("html, body").animate({ scrollTop: 0 }, 400);
            return false;
        });
    },

    // 复制功能
    copy: function() {
        $.getScript(maccms.path + "/template/conch/asset/js/stem/clipboard.min.js", function() {
            var copyBtns = document.getElementsByClassName("copy_btn");
            var clipboard = new Clipboard(copyBtns);
            
            clipboard.on("success", function(e) {
                $("#show").slideDown().delay(1500).slideUp(300);
                console.log(e);
            });
            
            clipboard.on("error", function(e) {
                $("#show").slideDown().delay(1500).slideUp(300);
                console.log(e);
            });
        });
    },

    // 微信公众号和赞赏弹窗
    wxqrcode: function() {
        var wxName = $("#wx_name").val();
        var wxDesc = $("#site_wxewmtext").val();
        var wxQrImg = $("#wx_qrcode").val();
        var zanQrImg = $("#zans_qrcode").val();

        // 公众号弹窗
        $(".btn_wxgzh").click(function() {
            $("body").append(
                '<div class="conch_wrap">' +
                '<div class="mac_pop_bg"></div>' +
                '<div class="conch_content">' +
                '<div class="conch_content_hd"><h4 class="conch_content_title"><span style="color: #f44336;">' + wxName + '<span></h4></div>' +
                '<div class="conch_content_bd"><img class="info_img" src="' + wxQrImg + '" alt="公众号二维码"><p>' + wxDesc + '</p></div>' +
                '<div class="conch_content_ft"><a class="close_box" href="javascript:;">下次再说</a></div>' +
                '</div></div>'
            );
            $(".close_box,.mac_pop_bg").click(function() {
                $(".conch_wrap").remove();
            });
        });

        // 赞赏弹窗
        $(".btn_zhans").click(function() {
            $("body").append(
                '<div class="conch_wrap">' +
                '<div class="mac_pop_bg"></div>' +
                '<div class="conch_content">' +
                '<div class="conch_content_hd"><h4 class="conch_content_title">感谢赞赏</h4></div>' +
                '<div class="conch_content_bd"><img class="info_img" src="' + zanQrImg + '" alt="赞赏二维码"><p>长按识别二维码或微信扫描二维码</p>金额随意，多少都是支持</p></div>' +
                '<div class="conch_content_ft"><a class="conch_btn_no" href="javascript:;">残忍拒绝</a><a class="close_box" href="javascript:;">取消</a></div>' +
                '</div></div>'
            );
            
            $(".conch_btn_no").click(function() {
                alert("就知道你会点，哼~，不过还要祝你观影愉快～！");
                $(".conch_wrap").remove();
            });
            
            $(".close_box,.mac_pop_bg").click(function() {
                $(".conch_wrap").remove();
            });
        });
    }
};

// 页面加载完成后初始化
 $(document).ready(function() {
    // 移动端初始化
    App.browser.useragent.mobile && (App.mobile.share(), App.mobile.xiaoshuo());
    
    // 通用功能初始化
    App.swiper();
    App.menu();
    App.fixed();
    App.Search();
    App.wrapper();
    App.flip();
    App.closebtn();
    App.shorturl();
    App.images.lazyload();
    App.images.qrcode();
    App.scrolltop();
    App.copy();
    App.wxqrcode();
});