/**
 * REM 布局适配库（解密还原版）
 * 功能：根据设备 DPR 动态设置 viewport 和 html font-size
 * 用途：实现移动端 100% 等比缩放（设计稿按 750px 宽度）
 */
(function(window, flexible) {
  var doc = window.document;
  var docEl = doc.documentElement;
  
  // 1. 优先从 viewport meta 获取 initial-scale
  var metaEl = doc.querySelector('meta[name="viewport"]');
  var flexibleEl = doc.querySelector('meta[name="flexible"]');
  var dpr = 0;
  var scale = 0;
  var tid;

  if (metaEl) {
    var match = metaEl.getAttribute('content').match(/initial-scale=([\d.]+)/);
    if (match) {
      scale = parseFloat(match[1]);
      dpr = parseInt(1 / scale);
    }
  } 
  // 2. 其次从 flexible meta 获取 dpr
  else if (flexibleEl) {
    var content = flexibleEl.getAttribute('content');
    var initialDpr = content.match(/initial-dpr=([\d.]+)/);
    var maximumDpr = content.match(/maximum-dpr=([\d.]+)/);
    
    if (initialDpr) {
      dpr = parseFloat(initialDpr[1]);
      scale = parseFloat((1 / dpr).toFixed(2));
    }
    if (maximumDpr) {
      dpr = parseFloat(maximumDpr[1]);
      scale = parseFloat((1 / dpr).toFixed(2));
    }
  }
  
  // 3. 无 meta 时根据 UA 推断 DPR
  if (!dpr && !scale) {
    var isIPhone = /iphone/gi.test(navigator.appVersion);
    var devicePixelRatio = window.devicePixelRatio;
    
    if (isIPhone) {
      // iPhone 根据设备像素比设置 DPR
      if (devicePixelRatio >= 3) dpr = 3;
      else if (devicePixelRatio >= 2) dpr = 2;
      else dpr = 1;
    } else {
      // Android 默认 DPR=1
      dpr = 1;
    }
    scale = 1 / dpr;
  }

  // 4. 设置 html[data-dpr] 属性
  docEl.setAttribute('data-dpr', dpr);

  // 5. 创建 viewport meta（如不存在）
  if (!metaEl) {
    metaEl = doc.createElement('meta');
    metaEl.name = 'viewport';
    metaEl.content = 'width=device-width, initial-scale=' + scale + 
                     ', maximum-scale=' + scale + 
                     ', minimum-scale=' + scale + 
                     ', user-scalable=no';
    
    if (docEl.firstElementChild) {
      docEl.firstElementChild.appendChild(metaEl);
    } else {
      var div = doc.createElement('div');
      div.innerHTML = metaEl.outerHTML;
      doc.write(div.innerHTML);
    }
  }

  // 6. 核心：根据屏幕宽度计算 REM 基准值
  function refreshRem() {
    var width = docEl.getBoundingClientRect().width;
    
    // 限制最大宽度 540px（对应设计稿 540px * DPR）
    if (width / dpr > 540) {
      width = 540 * dpr;
    }
    
    var rem = width / 10; // 1rem = 屏幕宽度/10
    docEl.style.fontSize = rem + 'px';
    
    // 暴露 REM 值
    flexible.rem = rem;
  }

  // 7. 事件监听（resize + orientationchange）
  window.addEventListener('resize', function() {
    clearTimeout(tid);
    tid = setTimeout(refreshRem, 300); // 防抖 300ms
  }, false);
  
  window.addEventListener('orientationchange', refreshRem, false);

  // 8. 初始执行
  refreshRem();

  // 9. 暴露 API
  flexible.dpr = dpr;          // 设备像素比
  flexible.rem = docEl.style.fontSize.replace('px', ''); // 当前 REM 值
  flexible.refreshRem = refreshRem; // 手动刷新
  
  // 单位转换工具
  flexible.rem2px = function(d) {
    var val = parseFloat(d) * this.rem;
    if (typeof d === 'string' && d.match(/rem$/)) {
      val += 'px';
    }
    return val;
  };
  
  flexible.px2rem = function(d) {
    var val = parseFloat(d) / this.rem;
    if (typeof d === 'string' && d.match(/px$/)) {
      val += 'rem';
    }
    return val;
  };
  
})(window, window.flexible || (window.flexible = {}));