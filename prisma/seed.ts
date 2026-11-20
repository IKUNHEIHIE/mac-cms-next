import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultSettings } from "../src/lib/settings";
import { importTypes, collectVods, LZ_API } from "../src/lib/collect";

const prisma = new PrismaClient();
const now = () => Math.floor(Date.now() / 1000);

async function main() {
  console.log("→ 导入资源站分类…");
  const { parents } = await importTypes(LZ_API);
  console.log("→ 采集影视数据（3 页）…");
  const stats = await collectVods({ pages: 3, markLevel: true });
  console.log("  影片:", stats);
  console.log("→ 补充分类片源（电影/综艺/动漫等）…");
  for (const typeId of [6, 7, 8, 9, 25, 26, 29, 30, 46, 52]) {
    try {
      await collectVods({ pages: 1, typeId });
    } catch (e) {
      console.warn(`  分类 ${typeId} 采集失败：`, e instanceof Error ? e.message : e);
    }
  }

  const vods = await prisma.vod.findMany({ orderBy: { vodTime: "desc" }, take: 24 });

  const groups = [
    { id: 1, name: "游客", popedom: ",1,6,7,8,9,10,11,12,2,13,14,15,16,3,4,5,17,18," },
    { id: 2, name: "默认会员", popedom: ",1,6,7,8,9,10,11,12,2,13,14,15,16,3,4,5,17,18," },
    { id: 3, name: "VIP会员", popedom: ",1,6,7,8,9,10,11,12,2,13,14,15,16,3,4,5,17,18," },
  ];
  for (const g of groups) {
    await prisma.group.upsert({
      where: { groupId: g.id },
      update: { groupName: g.name },
      create: {
        groupId: g.id,
        groupName: g.name,
        groupStatus: 1,
        groupType: ",1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,",
        groupPopedom: g.popedom,
        groupPointsDay: g.id === 3 ? 10 : 0,
        groupPointsWeek: g.id === 3 ? 70 : 0,
        groupPointsMonth: g.id === 3 ? 300 : 0,
        groupPointsYear: g.id === 3 ? 3600 : 0,
      },
    });
  }

  const pwdAdmin = await bcrypt.hash("admin123", 10);
  const pwdUser = await bcrypt.hash("demo123", 10);

  const admin = await prisma.admin.findFirst({ where: { adminName: "admin" } });
  if (admin) {
    await prisma.admin.update({ where: { adminId: admin.adminId }, data: { adminPwd: pwdAdmin, adminStatus: 1 } });
  } else {
    await prisma.admin.create({
      data: { adminName: "admin", adminPwd: pwdAdmin, adminStatus: 1, adminAuth: "all" },
    });
  }

  const demo = await prisma.user.findFirst({ where: { userName: "demo" } });
  if (!demo) {
    await prisma.user.create({
      data: {
        groupId: "3",
        userName: "demo",
        userPwd: pwdUser,
        userNickName: "演示会员",
        userEmail: "demo@example.com",
        userPoints: 1000,
        userStatus: 1,
        userRegTime: now(),
        userEndTime: now() + 86400 * 365,
      },
    });
  }

  console.log("→ 生成专题 / 资讯 / 演员…");
  const topicPics = vods.slice(0, 3).map((v) => v.vodPicSlide || v.vodPic);
  const topic = await prisma.topic.findFirst({ where: { topicName: "2026 热播剧集精选" } });
  const topicData = {
    topicName: "2026 热播剧集精选",
    topicEn: "hot-2026",
    topicSub: "年度高热剧集与电影一次看个够",
    topicStatus: 1,
    topicSort: 1,
    topicPic: topicPics[0] || "",
    topicPicSlide: topicPics[0] || "",
    topicBlurb: "编辑精选：近期热度最高的影视作品合集。",
    topicRemarks: "持续更新",
    topicLevel: 9,
    topicHits: 12800,
    topicTime: now(),
    topicTimeAdd: now(),
    topicRelVod: vods.slice(0, 12).map((v) => v.vodId).join(","),
    topicRelArt: "",
    topicContent: "<p>本专题收录近期热度最高的影视作品，持续更新。</p>",
    topicExtend: "{}",
    topicTag: "热播,精选",
    topicKey: "热播,精选,剧集",
    topicDes: "2026 热播剧集精选",
    topicTitle: "2026 热播剧集精选",
  };
  if (!topic) await prisma.topic.create({ data: topicData });
  else await prisma.topic.update({ where: { topicId: topic.topicId }, data: topicData });

  for (let i = 0; i < 4; i++) {
    const name = ["本周新片速览", "热播剧集追更指南", "高分动漫推荐", "综艺看点盘点"][i];
    const exists = await prisma.art.findFirst({ where: { artName: name } });
    const v = vods[i] || vods[0];
    const data = {
      typeId: 5,
      typeId1: 0,
      groupId: 0,
      artName: name,
      artSub: name,
      artEn: `news-${i + 1}`,
      artStatus: 1,
      artLetter: "N",
      artFrom: "本站",
      artAuthor: "编辑",
      artPic: v?.vodPic || "",
      artPicThumb: v?.vodPic || "",
      artBlurb: `${name}，为你盘点近期值得一看的影视内容。`,
      artRemarks: "推荐",
      artLevel: 9,
      artHits: 3000 + i * 800,
      artScore: 8.5,
      artTime: now() - i * 3600,
      artTimeAdd: now() - i * 3600,
      artContent: `<p>${name}。以下内容由本站编辑整理，数据来源于公开资源站。</p><p>${v?.vodName ? `本期重点推荐《${v.vodName}》。` : ""}</p>`,
    };
    if (exists) await prisma.art.update({ where: { artId: exists.artId }, data });
    else await prisma.art.create({ data });
  }

  const names = new Map<string, number>();
  for (const v of vods.slice(0, 16)) {
    for (const n of (v.vodActor || "").split(/[,，]/).map((s) => s.trim())) {
      if (n && !names.has(n)) names.set(n, v.vodId);
    }
  }
  let idx = 0;
  for (const [name, vid] of [...names].slice(0, 12)) {
    idx++;
    const exists = await prisma.actor.findFirst({ where: { actorName: name } });
    const data = {
      actorName: name,
      actorEn: `actor${idx}`,
      actorStatus: 1,
      actorLetter: "A",
      actorSex: idx % 2 ? "男" : "女",
      actorPic: vods[idx % vods.length]?.vodPic || "",
      actorBlurb: `${name}，影视演员。`,
      actorArea: "大陆",
      actorLevel: 9,
      actorHits: 500 + idx * 100,
      actorTime: now(),
      actorTimeAdd: now(),
      actorContent: `<p>${name}，参演作品包括《${vods.find((x) => x.vodId === vid)?.vodName || ""}》等。</p>`,
    };
    if (exists) await prisma.actor.update({ where: { actorId: exists.actorId }, data });
    else await prisma.actor.create({ data });
  }

  const firstName = names.keys().next().value as string | undefined;
  if (firstName) {
    const actor = await prisma.actor.findFirst({ where: { actorName: firstName } });
    if (actor) {
      await prisma.role.upsert({
        where: { roleId: 1 },
        update: {},
        create: {
          roleId: 1,
          roleRid: actor.actorId,
          roleName: "主角",
          roleEn: "hero",
          roleStatus: 1,
          roleActor: firstName,
          rolePic: actor.actorPic || "",
          roleSort: 1,
          roleLevel: 9,
          roleTime: now(),
          roleTimeAdd: now(),
          roleContent: "<p>主要角色。</p>",
        },
      });
    }
  }

  for (const [i, name] of ["量子资源", "LZ线路", "备用线路", "高速线路"].entries()) {
    await prisma.link.upsert({
      where: { linkId: i + 1 },
      update: {},
      create: {
        linkId: i + 1,
        linkType: 0,
        linkName: name,
        linkSort: i,
        linkUrl: "https://lzizy.net/",
        linkAddTime: now(),
        linkTime: now(),
      },
    });
  }

  const firstVod = vods[0];
  if (firstVod) {
    const c = await prisma.comment.findFirst({ where: { commentRid: firstVod.vodId } });
    if (!c) {
      await prisma.comment.createMany({
        data: [
          { commentMid: 1, commentRid: firstVod.vodId, commentStatus: 1, commentName: "影迷小张", commentTime: now() - 600, commentContent: "画质不错，更新也快，支持一下！", commentUp: 12 },
          { commentMid: 1, commentRid: firstVod.vodId, commentStatus: 1, commentName: "追剧达人", commentTime: now() - 300, commentContent: "线路很流畅，期待后续剧集。", commentUp: 8 },
          { commentMid: 1, commentRid: firstVod.vodId, commentStatus: 1, commentName: "游客", commentTime: now() - 60, commentContent: "找了好久终于有了。", commentUp: 3 },
        ],
      });
    }
  }

  await prisma.gbook.deleteMany({ where: { gbookName: "演示留言" } });
  await prisma.gbook.create({
    data: {
      gbookRid: 0,
      userId: 0,
      gbookStatus: 1,
      gbookName: "演示留言",
      gbookTime: now() - 1200,
      gbookContent: "希望增加更多 4K 资源，谢谢站长！",
      gbookReply: "感谢支持，会持续更新。",
      gbookReplyTime: now() - 600,
    },
  });

  const demoUser = await prisma.user.findFirst({ where: { userName: "demo" } });
  if (demoUser) {
    for (let i = 0; i < 3; i++) {
      const v = vods[i];
      if (!v) continue;
      const exists = await prisma.ulog.findFirst({
        where: { userId: demoUser.userId, ulogType: 1, ulogRid: v.vodId },
      });
      if (!exists) {
        await prisma.ulog.create({
          data: { userId: demoUser.userId, ulogMid: 1, ulogType: 1, ulogRid: v.vodId, ulogTime: now() - i * 300 },
        });
      }
    }
    await prisma.order.upsert({
      where: { orderId: 1 },
      update: {},
      create: {
        orderId: 1,
        userId: demoUser.userId,
        orderStatus: 1,
        orderCode: `MAC${Date.now()}`,
        orderPrice: 30,
        orderTime: now() - 86400,
        orderPoints: 300,
        orderPayType: "alipay",
        orderPayTime: now() - 86000,
        orderRemarks: "VIP 月度充值",
      },
    });
    await prisma.card.upsert({
      where: { cardId: 1 },
      update: {},
      create: {
        cardId: 1,
        cardNo: "MAC888888",
        cardPwd: "888888",
        cardMoney: 30,
        cardPoints: 300,
        cardUseStatus: 0,
        cardSaleStatus: 1,
        cardAddTime: now(),
      },
    });
  }

  for (const key of ["site", "theme"] as const) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(defaultSettings[key]) },
    });
  }

  const collect = await prisma.collect.findFirst({ where: { collectName: "量子资源" } });
  if (!collect) {
    await prisma.collect.create({
      data: {
        collectName: "量子资源",
        collectUrl: LZ_API,
        collectType: 1,
        collectMid: 1,
        collectFilter: 0,
        collectOpt: 0,
      },
    });
  }

  console.log("✓ 初始化完成：admin/admin123，demo/demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());