(function(window, lib) {
    var doc = window.document;
    var docEl = doc.documentElement;
    var metaEl = doc.querySelector('meta[name="viewport"]');
    var flexibleEl = doc.querySelector('meta[name="flexible"]');
    
    var dpr = 0;
    var scale = 0;
    var tid;
    
    var flexible = lib.flexible || (lib.flexible = {});

    // 1. 获取 DPR (设备像素比) 和 Scale (缩放比例)
    if (metaEl) {
        // 如果有 viewport meta 标签，尝试解析 initial-scale
        var match = metaEl.getAttribute("content").match(/initial\-scale=([\d\.]+)/);
        if (match) {
            scale = parseFloat(match[1]);
            dpr = parseInt(1 / scale);
        }
    } else if (flexibleEl) {
        // 如果有 flexible meta 标签，尝试解析 initial-dpr
        var content = flexibleEl.getAttribute("content");
        if (content) {
            var initialDprMatch = content.match(/initial\-dpr=([\d\.]+)/);
            var maximumDprMatch = content.match(/maximum\-dpr=([\d\.]+)/);
            if (initialDprMatch) {
                dpr = parseFloat(initialDprMatch[1]);
                scale = parseFloat((1 / dpr).toFixed(2));
            }
            if (maximumDprMatch) {
                dpr = parseFloat(maximumDprMatch[1]);
                scale = parseFloat((1 / dpr).toFixed(2));
            }
        }
    }

    // 如果 meta 标签中没有配置，则根据设备类型自动计算
    if (!dpr && !scale) {
        var isAndroid = window.navigator.appVersion.match(/android/gi);
        var isIPhone = window.navigator.appVersion.match(/iphone/gi);
        var devicePixelRatio = window.devicePixelRatio;

        if (isIPhone) {
            // iOS 设备适配
            if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
                dpr = 3;
            } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)) {
                dpr = 2;
            } else {
                dpr = 1;
            }
        } else {
            // Android 或其他设备默认为 1
            dpr = 1;
        }
        scale = 1 / dpr;
    }

    // 设置根元素的 data-dpr 属性，方便 CSS 做 hack
    docEl.setAttribute("data-dpr", dpr);

    // 2. 动态设置或重写 viewport meta 标签
    if (!metaEl) {
        metaEl = doc.createElement("meta");
        metaEl.setAttribute("name", "viewport");
        // 禁止用户缩放，强制使用计算的 scale
        metaEl.setAttribute("content", "initial-scale=" + scale + ", maximum-scale=" + scale + ", minimum-scale=" + scale + ", user-scalable=no");
        if (docEl.firstElementChild) {
            docEl.firstElementChild.appendChild(metaEl);
        } else {
            var container = doc.createElement("div");
            container.appendChild(metaEl);
            doc.write(container.innerHTML);
        }
    }

    // 3. 计算 Rem 的核心函数
    function refreshRem() {
        // [混淆部分已移除] 原代码在这里包含了一大段正则检测和 console 劫持代码，纯粹为了干扰分析，已删除。

        var width = docEl.getBoundingClientRect().width;

        // 适配逻辑：如果屏幕宽度除以 dpr 大于 768 (iPad 或 PC 端)，则限制最大宽度
        if (width / dpr > 768) {
            width = 768 * dpr;
        }

        // 将屏幕宽度分为 10 份，每份为 1rem
        var rem = width / 10;
        docEl.style.fontSize = rem + "px";
        flexible.rem = window.rem = rem;
    }

    // 监听窗口调整事件，防抖处理
    window.addEventListener("resize", function() {
        clearTimeout(tid);
        tid = setTimeout(refreshRem, 300);
    }, false);

    // 监听 pageshow 事件（处理从缓存中恢复页面）
    window.addEventListener("pageshow", function(e) {
        if (e.persisted) {
            clearTimeout(tid);
            tid = setTimeout(refreshRem, 300);
        }
    }, false);

    // 初始化执行
    refreshRem();

    // 4. 暴露工具函数
    flexible.dpr = window.dpr = dpr;
    flexible.refreshRem = refreshRem;

    flexible.rem2px = function(d) {
        var val = parseFloat(d) * this.rem;
        if (typeof d === "string" && d.match(/rem$/)) {
            val += "px";
        }
        return val;
    };

    flexible.px2rem = function(d) {
        var val = parseFloat(d) / this.rem;
        if (typeof d === "string" && d.match(/px$/)) {
            val += "rem";
        }
        return val;
    };

})(window, window.lib || (window.lib = {}));