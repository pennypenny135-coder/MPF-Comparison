export interface FundLinkTarget {
  trustee?: string | null;
  fundName?: string | null;
}

const TRUSTEE_FUND_PRICE_LINKS: Array<{
  pattern: RegExp;
  url: string;
}> = [
  {
    pattern: /hsbc|滙豐|恒生/i,
    url: "https://www.hsbc.com.hk/mpf/tool/unit-prices/",
  },
  {
    pattern: /宏利|manulife/i,
    url: "https://www.manulife.com.hk/en/individual/fund-price/mpf.html/v2?product=Manulife%20Global%20Select%20(MPF)%20Scheme",
  },
  {
    pattern: /銀聯信託|bct/i,
    url: "https://www.bcthk.com/en/mpf-orso/fund-information/fund-prices",
  },
  {
    pattern: /東亞|bea/i,
    url: "https://www.hkbea.com/html/tc/bea-mpf-fund-information.html",
  },
  {
    pattern: /永明|sun life/i,
    url: "https://www.sunlife.com.hk/zh-hant/investments/mpf-orso-fund-prices-performance/mpf-fund-prices-performance/",
  },
  {
    pattern: /友邦信託|aia/i,
    url: "https://www.aia.com.hk/zh-hk/products/mpf/list",
  },
  {
    pattern: /中銀保誠|bocpt|boci-pru/i,
    url: "https://www.bocpt.com/homepage/easy-choice-mpf/fund-price-enquiry/",
  },
  {
    pattern: /萬通|yf life/i,
    url: "https://www.yflife.com/tc/product/mpf-hongkong/fund-price-history/",
  },
  {
    pattern: /交通/i,
    url: "https://www.bocomtrust.com.hk/BankCommSite/shtml/trust/tw/2600764/2600785/2600787/2600908/2600911/list.shtml?channelId=2600764",
  },
  {
    pattern: /中國人壽|china life/i,
    url: "https://trustee.chinalife.com.hk/mpf/dailyPrices",
  },
  {
    pattern: /渣打信托|新地/i,
    url: "https://www.shkp.com/zh-HK/work-with-us/shkp-mpf-employer-sponsored-scheme",
  },
];

export function getOfficialFundUrl(
  fund: FundLinkTarget,
): string | null {
  const trustee = fund.trustee ?? "";
  const fundName = fund.fundName ?? "";
  const haystack = `${trustee} ${fundName}`;

  return (
    TRUSTEE_FUND_PRICE_LINKS.find((link) => link.pattern.test(haystack))
      ?.url ?? null
  );
}
