import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import ApiForm from "@/components/member/ApiForm";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "积分提现" };

export default async function CashPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const list = await prisma.cash.findMany({ where: { userId: user.userId }, orderBy: { cashTime: "desc" } });
  return (
    <MemberPage title="积分提现">
      <h2>申请提现</h2>
      <p style={{ color: "#999" }}>当前积分 {user.userPoints}，100 积分 = 1 元，最低提现 1000 积分。</p>
      <ApiForm
        action="/api/user/cash"
        refresh
        submitText="提交申请"
        fields={[
          { name: "points", label: "提现积分", type: "number", placeholder: "至少 1000", required: true },
          { name: "bank_name", label: "开户银行", placeholder: "如：支付宝", required: true },
          { name: "bank_no", label: "收款账号", required: true },
          { name: "payee_name", label: "收款人", required: true },
        ]}
      />
      <h2 style={{ marginTop: 26 }}>提现记录</h2>
      <table className="mc_table">
        <thead>
          <tr>
            <th>积分</th>
            <th>金额</th>
            <th>收款账号</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.cashId}>
              <td>{c.cashPoints}</td>
              <td>￥{c.cashMoney.toFixed(2)}</td>
              <td>{c.cashBankName} {c.cashBankNo}</td>
              <td>{c.cashStatus === 0 ? "待审核" : c.cashStatus === 1 ? "已打款" : "已拒绝"}</td>
              <td>{fmtTime(c.cashTime, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 ? <p style={{ color: "#999" }}>暂无提现记录</p> : null}
    </MemberPage>
  );
}