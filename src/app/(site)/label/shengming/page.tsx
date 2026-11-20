export const metadata = { title: "免责声明" };

export default function ShengmingPage() {
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <h2 className="title">免责声明</h2>
        </div>
        <div style={{ lineHeight: 2, color: "#555", padding: "0.3rem 0", fontSize: "0.34rem" }}>
          <p>本站所有内容均来自互联网公开资源，仅供学习交流使用，不用于任何商业用途。</p>
          <p>本站不存储、不制作任何视频文件，仅提供影视信息索引与播放链接跳转。</p>
          <p>如权利人认为内容侵犯其合法权益，请联系站点邮箱，我们将在核实后及时处理。</p>
          <p>访问者应遵守当地法律法规，因使用本站内容产生的一切后果由访问者自行承担。</p>
        </div>
      </div>
    </div>
  );
}