export interface FundLinkTarget {
  scheme?: string | null;
  trustee?: string | null;
  fundName?: string | null;
}

const SCHEME_FUND_PRICE_LINKS: Array<{
  pattern: RegExp;
  url: string;
}> = [
  {
    pattern: /海通MPF退休金/i,
    url: "https://gthtam.com.hk/mpf/zh-cht",
  },
  {
    pattern: /恒生強積金智選計劃/i,
    url: "https://www.hangseng.com/zh-hk/personal/insurance-mpf/e-mpf/fund-price-performance/",
  },
  {
    pattern: /滙豐強積金智選計劃|富達退休集成信託/i,
    url: "https://www.hsbc.com.hk/mpf/tool/unit-prices/",
  },
  {
    pattern: /宏利環球精選|宏利退休精選/i,
    url: "https://www.manulife.com.hk/en/individual/fund-price/mpf.html",
  },
  {
    pattern: /BCT強積金|BCT（強積金）|BCT積金之選/i,
    url: "https://www.bcthk.com/en/mpf-orso/fund-information/fund-prices",
  },
  {
    pattern: /東亞（強積金）/i,
    url: "https://www.hkbea.com/html/tc/bea-mpf-fund-information.html",
  },
  {
    pattern: /永明彩虹強積金計劃/i,
    url: "https://www.sunlife.com.hk/zh-hant/investments/mpf-orso-fund-prices-performance/mpf-fund-prices-performance/",
  },
  {
    pattern: /友邦強積金優選計劃/i,
    url: "https://www.aia.com.hk/zh-hk/products/mpf/list",
  },
  {
    pattern: /中銀保誠簡易強積金計劃|我的強積金計劃/i,
    url: "https://www.bocpt.com/homepage/easy-choice-mpf/fund-price-enquiry/",
  },
  {
    pattern: /萬全強制性公積金計劃/i,
    url: "https://www.yflife.com/tc/product/mpf-hongkong/fund-price-history/",
  },
  {
    pattern: /交通銀行愉盈退休強積金計劃/i,
    url: "https://www.bocomtrust.com.hk/BankCommSite/shtml/trust/tw/2600764/2600785/2600787/2600908/2600911/list.shtml?channelId=2600764",
  },
  {
    pattern: /中國人壽強積金集成信託計劃/i,
    url: "https://trustee.chinalife.com.hk/mpf/dailyPrices",
  },
  {
    pattern: /新地強積金僱主營辦計劃/i,
    url: "https://www.shkp.com/zh-HK/work-with-us/shkp-mpf-employer-sponsored-scheme",
  },
];

export function getOfficialFundUrl(
  fund: FundLinkTarget,
): string | null {
  const scheme = fund.scheme ?? "";

  return (
    SCHEME_FUND_PRICE_LINKS.find((link) => link.pattern.test(scheme))
      ?.url ?? null
  );
}
