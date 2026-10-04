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
