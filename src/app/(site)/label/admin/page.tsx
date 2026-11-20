import Link from "next/link";

export const metadata = { title: "管理入口" };

export default function LabelAdminPage() {
  return (
    <div className="container">
      <div className="pannel clearfix" style={{ padding: "1rem 0", textAlign: "center" }}>
        <h2 className="title" style={{ float: "none" }}>站点管理</h2>
        <p style={{ margin: "0.4rem 0" }}>
          <Link className="mc_btn" href="/admin">
            进入管理后台
          </Link>
        </p>
        <p style={{ color: "#999", fontSize: "0.3rem" }}>默认账号 admin / admin123，请登录后及时修改。</p>
      </div>
    </div>
  );
}