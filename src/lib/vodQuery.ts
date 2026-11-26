import type { Prisma } from "@prisma/client";

export const VOD_CARD_SELECT = {
  vodId: true,
  vodName: true,
  vodSub: true,
  vodPic: true,
  vodPicThumb: true,
  vodRemarks: true,
  vodSerial: true,
  vodScore: true,
  vodYear: true,
  vodClass: true,
  vodActor: true,
} satisfies Prisma.VodSelect;

export const VOD_CARD_PLAY_SELECT = {
  ...VOD_CARD_SELECT,
  vodPlayFrom: true,
  vodPlayUrl: true,
} satisfies Prisma.VodSelect;

export const VOD_BANNER_SELECT = {
  ...VOD_CARD_PLAY_SELECT,
  vodPicSlide: true,
} satisfies Prisma.VodSelect;

export const VOD_RANK_SELECT = {
  vodId: true,
  vodName: true,
  typeId: true,
  vodPlayFrom: true,
  vodPlayUrl: true,
} satisfies Prisma.VodSelect;

export const VOD_TOP_SELECT = {
  vodId: true,
  vodName: true,
} satisfies Prisma.VodSelect;

export function vodCardSelect(playlink?: number | null) {
  return playlink ? VOD_CARD_PLAY_SELECT : VOD_CARD_SELECT;
}

export function typeVodWhere(typeId: number, hasChildren: boolean, extra?: Prisma.VodWhereInput): Prisma.VodWhereInput {
  return {
    vodStatus: 1,
    ...(hasChildren ? { typeId1: typeId } : { typeId }),
    ...extra,
  };
}