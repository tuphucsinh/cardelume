import type { CardDocument } from "@cardelume/card-schema";

export type CardFormat = CardDocument["format"];

export type CardFormatSpec = {
  format:CardFormat;
  front:{widthIn:number;heightIn:number;widthPx:number;heightPx:number};
  pdf:{widthIn:number;heightIn:number;pageCount:number;layout:"single"|"folded-outside-inside"};
  dpi:300;
  safeMarginIn:number;
};

const DPI=300 as const;

const specs:Record<CardFormat,CardFormatSpec>={
  "portrait-5x7":{
    format:"portrait-5x7",
    front:{widthIn:5,heightIn:7,widthPx:1500,heightPx:2100},
    pdf:{widthIn:5,heightIn:7,pageCount:1,layout:"single"},dpi:DPI,safeMarginIn:.25
  },
  "folded-5x7":{
    format:"folded-5x7",
    // JPG is the finished front panel. PDF is a 10×7 outside spread plus
    // a blank inside spread so a home/print-shop duplex workflow is possible.
    front:{widthIn:5,heightIn:7,widthPx:1500,heightPx:2100},
    pdf:{widthIn:10,heightIn:7,pageCount:2,layout:"folded-outside-inside"},dpi:DPI,safeMarginIn:.25
  },
  "square-5x5":{
    format:"square-5x5",
    front:{widthIn:5,heightIn:5,widthPx:1500,heightPx:1500},
    pdf:{widthIn:5,heightIn:5,pageCount:1,layout:"single"},dpi:DPI,safeMarginIn:.25
  },
  "landscape-7x5":{
    format:"landscape-7x5",
    front:{widthIn:7,heightIn:5,widthPx:2100,heightPx:1500},
    pdf:{widthIn:7,heightIn:5,pageCount:1,layout:"single"},dpi:DPI,safeMarginIn:.25
  },
  "postcard-6x4":{
    format:"postcard-6x4",
    front:{widthIn:6,heightIn:4,widthPx:1800,heightPx:1200},
    pdf:{widthIn:6,heightIn:4,pageCount:1,layout:"single"},dpi:DPI,safeMarginIn:.20
  }
};

export function getCardFormatSpec(format:CardFormat):CardFormatSpec{
  return specs[format];
}

export function inchesToPoints(value:number){return value*72;}
