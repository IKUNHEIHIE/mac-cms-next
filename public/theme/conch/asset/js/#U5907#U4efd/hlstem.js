// ========== 浏览器环境检测 ==========
var browserInfo = {
  url: document.URL,
  domain: document.domain,
  title: document.title,
  urlpath: location.pathname,
  language: (navigator.browserLanguage || navigator.language).toLowerCase(),
  canvas: function() { /* 检测 canvas 支持 */ },
  useragent: {
    mobile: /AppleWebKit.*Mobile/i.test(navigator.userAgent),
    ios: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    android: /Android/i.test(navigator.userAgent),
    weixin: /MicroMessenger/i.test(navigator.userAgent)
    // ... 其他 UA 检测
  }
};

// ========== 移动端菜单交互 ==========
function initMobileMenu() {
  if ($(window).width() < 820) {
    $('.menu-btn').click(function() {
      $('html,body').addClass('menu_block');
      $('.close_menu').fadeIn();
    });
    $('.close_menu').click(function() {
      $('html,body').removeClass('menu_block');
      $(this).fadeOut();
    });
  }
}

// ========== 图片懒加载 ==========
function initLazyLoad() {
  $.getScript(maccms.path + '/template/conch/asset/js/stem/jquery.lazyload.min.js', function() {
    $('.vodlist_thumb').lazyload({
      effect: 'fadeIn',
      threshold: 200,
      failure_limit: 20
    });
    // 小屏设备特殊处理...
  });
}

// ========== 二维码生成 ==========
function initQRCode() {
  $.getScript(maccms.path + '/template/conch/asset/js/stem/qrcode.min.js', function() {
    $('.qrcode-canvas').qrcode({
      width: 120,
      height: 120,
      text: encodeURI(browserInfo.urlpath)
    });
  });
}

// ========== 滚动固定头部 ==========
$(window).scroll(function() {
  if ($(this).scrollTop() > 50) {
    $('.nav_fixed').addClass('active');
  } else {
    $('.nav_fixed').removeClass('active');
  }
});

// ========== 短链接生成（对接第三方API）==========
function generateShortUrl() {
  var longUrl = encodeURIComponent(browserInfo.url);
  $.get('https://api.example.com/shorten?url=' + longUrl, function(res) {
    $('#short_url_input').val(res.data.url);
  });
}
