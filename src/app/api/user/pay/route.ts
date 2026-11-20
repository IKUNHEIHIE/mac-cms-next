import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addPoints, currentUser } from "@/lib/user";

const PACKAGES = [
  { id: "p300", points: 300, price: 30 },
  { id: "p1000", points: 1000, price: 88 },
  { id: "p3000", points: 3000, price: 228 },
  { id: "p10000", points: 10000, price: 688 },
];

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const pkg = PACKAGES.find((p) => p.id === b.package);
  if (!pkg) return NextResponse.json({ code: 0, msg: "请选择充值套餐" }, { status: 400 });
  const now = Math.floor(Date.now() / 1000);
  const order = await prisma.order.create({
    data: {
      userId: user.userId,
      orderStatus: 1,
      orderCode: `MAC${now}${Math.floor(Math.random() * 900 + 100)}`,
      orderPrice: pkg.price,
      orderTime: now,
      orderPoints: pkg.points,
      orderPayType: String(b.pay_type || "demo"),
      orderPayTime: now,
      orderRemarks: `积分充值 ${pkg.points}`,
    },
  });
  await addPoints(user.userId, pkg.points, `在线充值订单 ${order.orderCode}`, 1);
  return NextResponse.json({ code: 1, msg: `充值成功，获得 ${pkg.points} 积分`, order });
}

export const dynamic = "force-dynamic";