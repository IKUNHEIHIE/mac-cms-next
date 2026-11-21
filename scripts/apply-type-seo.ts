import { prisma } from "../src/lib/db";
import { typeSeoFor } from "../src/lib/typeSeo";

async function main() {
  const types = await prisma.type.findMany({ select: { typeId: true, typeName: true } });
  for (const t of types) {
    const seo = typeSeoFor(t.typeId, t.typeName);
    await prisma.type.update({
      where: { typeId: t.typeId },
      data: { typeTitle: seo.title, typeDes: seo.description, typeKey: seo.keywords },
    });
  }
  console.log(`已写入 ${types.length} 个分类的 SEO 简介`);
  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
