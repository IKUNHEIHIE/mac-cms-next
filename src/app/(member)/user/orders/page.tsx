import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "我的订单" };

const STATUS: Record<number, string> = { 0: "未支付", 1: "已支付", 2: "已取消" };

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const orders = await prisma.order.findMany({ where: { userId: user.userId }, orderBy: { orderTime: "desc" } });
  return (
    <MemberPage title="我的订单">
      {orders.length === 0 ? <div className="mc_empty">暂无订单</div> : null}
      <table className="mc_table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>积分</th>
            <th>金额</th>
            <th>状态</th>
            <th>支付方式</th>
            <th>下单时间</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderId}>
              <td>{o.orderCode}</td>
              <td>{o.orderPoints}</td>
              <td>￥{o.orderPrice.toFixed(2)}</td>
              <td>{STATUS[o.orderStatus] || o.orderStatus}</td>
              <td>{o.orderPayType || "-"}</td>
              <td>{fmtTime(o.orderTime, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MemberPage>
  );
}