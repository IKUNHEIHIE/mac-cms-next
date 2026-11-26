export type MatchLocalType = { typeId: number; typeName: string; typePid: number; typeMid: number };
export type MatchRemoteType = { type_id: number; type_pid: number; type_name: string };

const ALIASES: Record<string, string> = {
  "电影": "电影片",
  "电视剧": "连续剧",
  "动漫电影": "动画片",
  "大陆剧": "国产剧",
  "韩剧": "韩国剧",
  "美剧": "欧美剧",
  "港澳剧": "香港剧",
  "日剧": "日本剧",
  "泰剧": "泰国剧",
  "中国动漫": "国产动漫",
  "日本动漫": "日韩动漫",
  "动漫": "动漫片",
  "动画": "动漫片",
  "综艺": "综艺片",
  "记录片": "纪录片",
  "纪录片": "纪录片",
  "短剧": "短剧",
  "微短剧": "短剧",
  "漫剧": "AI漫剧",
  "体育": "体育",
  "赛事": "体育",
  "体育赛事": "体育",
  "台球": "斯诺克",
};

function normalize(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[（(].*?[）)]/g, "")
    .replace(/[\s·・:：\-_/]/g, "")
    .replace(/[「」【】[\]]/g, "")
    .trim();
}

function baseName(value: string) {
  return normalize(value).replace(/片$/, "");
}

function variants(value: string) {
  const n = normalize(value);
  return new Set([n, baseName(value), ALIASES[n]].filter(Boolean));
}

function choose(candidates: MatchLocalType[], remote: MatchRemoteType, parentLocal?: number) {
  if (!candidates.length) return null;
  const sameId = candidates.find((c) => c.typeId === remote.type_id);
  if (sameId) return sameId;
  if (parentLocal) {
    const underParent = candidates.filter((c) => c.typePid === parentLocal);
    if (underParent.length === 1) return underParent[0];
  }
  const leaves = candidates.filter((c) => c.typePid !== 0);
  if (leaves.length === 1) return leaves[0];
  const tops = candidates.filter((c) => c.typePid === 0);
  if (tops.length === 1) return tops[0];
  return null;
}

export function smartBind(
  remoteTypes: MatchRemoteType[],
  localTypes: MatchLocalType[],
  existing: Record<number, number> = {},
) {
  const localVideo = localTypes.filter((t) => t.typeMid === 1);
  const localById = new Map(localVideo.map((t) => [t.typeId, t]));
  const bindings: Record<number, number> = {};
  for (const [remote, local] of Object.entries(existing)) {
    if (localById.has(local)) bindings[Number(remote)] = local;
  }
  const matched: { remoteId: number; remoteName: string; localId: number; localName: string }[] = [];
  const unmatched: { remoteId: number; remoteName: string }[] = [];
  const parentMap: Record<number, number> = {};
  const byName = new Map<string, MatchLocalType[]>();
  const byBase = new Map<string, MatchLocalType[]>();
  for (const local of localVideo) {
    for (const key of variants(local.typeName)) {
      const list = byName.get(key) || [];
      list.push(local);
      byName.set(key, list);
    }
    const base = baseName(local.typeName);
    const list = byBase.get(base) || [];
    list.push(local);
    byBase.set(base, list);
  }

  const ordered = [...remoteTypes].sort((a, b) => (a.type_pid === 0 ? -1 : 1) - (b.type_pid === 0 ? -1 : 1));
  for (const remote of ordered) {
    if (bindings[remote.type_id]) {
      const local = localById.get(bindings[remote.type_id]);
      if (local) matched.push({ remoteId: remote.type_id, remoteName: remote.type_name, localId: local.typeId, localName: local.typeName });
      parentMap[remote.type_id] = bindings[remote.type_id];
      continue;
    }
    const parentLocal = remote.type_pid ? parentMap[remote.type_pid] : undefined;
    let candidates: MatchLocalType[] = [];
    for (const key of variants(remote.type_name)) candidates.push(...(byName.get(key) || []));
    candidates = [...new Map(candidates.map((c) => [c.typeId, c])).values()];
    if (!candidates.length) candidates = [...new Map((byBase.get(baseName(remote.type_name)) || []).map((c) => [c.typeId, c])).values()];
    let local = choose(candidates, remote, parentLocal);
    if (!local && parentLocal) {
      const parentType = localById.get(parentLocal);
      if (parentType) local = parentType;
    }
    if (local) {
      bindings[remote.type_id] = local.typeId;
      parentMap[remote.type_id] = local.typeId;
      matched.push({ remoteId: remote.type_id, remoteName: remote.type_name, localId: local.typeId, localName: local.typeName });
    } else {
      unmatched.push({ remoteId: remote.type_id, remoteName: remote.type_name });
    }
  }
  return { bindings, matched, unmatched };
}
