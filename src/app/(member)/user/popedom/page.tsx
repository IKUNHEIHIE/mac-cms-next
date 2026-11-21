import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser, groupIdOf } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "我的权限" };

export default async function PopedomPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const gid = groupIdOf(user);
  const group = await prisma.group.findFirst({ where: { groupId: gid } });
  const types = await prisma.type.findMany({ where: { typeMid: 1, typePid: 0 }, orderBy: { typeSort: "asc" } });
  const allowed = (group?.groupType || "").split(",").filter(Boolean).map(Number);
  return (
    <MemberPage title="我的权限">
      <h2>{group?.groupName || "默认会员"}</h2>
      <table className="mc_table">
        <thead>
          <tr>
            <th>分类</th>
            <th>访问权限</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.typeId}>
              <td>{t.typeName}</td>
              <td>{allowed.length === 0 || allowed.includes(t.typeId) ? "可访问" : "不可访问"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MemberPage>
  );
}