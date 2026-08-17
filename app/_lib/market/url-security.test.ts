import { describe, expect, it } from "vitest";

import { isSafePublicHttpsUrl } from "./listing-match";

const unsafeUrls = [
  "http://example.com/item",
  "javascript:alert(1)",
  "data:text/html,secret",
  "file:///etc/passwd",
  "ftp://example.com/item",
  "https://user:password@example.com/item",
  "https://example.com:444/item",
  "https://localhost/item",
  "https://api.localhost/item",
  "https://printer.local/item",
  "https://metadata/item",
  "https://metadata.google.internal/computeMetadata/v1/",
  "https://instance-data/item",
  "https://instance-data.ec2.internal/latest/meta-data/",
  "https://0.0.0.0/item",
  "https://10.0.0.1/item",
  "https://10.255.255.255/item",
  "https://100.64.0.1/item",
  "https://100.127.255.254/item",
  "https://127.0.0.1/item",
  "https://127.255.255.255/item",
  "https://169.254.169.254/latest/meta-data/",
  "https://172.16.0.1/item",
  "https://172.31.255.255/item",
  "https://192.0.0.1/item",
  "https://192.0.2.1/item",
  "https://192.168.0.1/item",
  "https://198.18.0.1/item",
  "https://198.19.255.255/item",
  "https://198.51.100.1/item",
  "https://203.0.113.1/item",
  "https://224.0.0.1/item",
  "https://255.255.255.255/item",
  "https://[::]/item",
  "https://[::1]/item",
  "https://[fc00::1]/item",
  "https://[fd12:3456::1]/item",
  "https://[fe80::1]/item",
  "https://[ff02::1]/item",
  "https://[2001:db8::1]/item",
  "https://[::ffff:127.0.0.1]/item",
  "https://[::ffff:169.254.169.254]/item",
  "https://2130706433/item",
  "https://0x7f000001/item",
  "https://127.1/item",
  "not a URL",
  "",
  `https://example.com/${"x".repeat(2_049)}`,
] as const;

const safeUrls = [
  "https://example.com/item",
  "https://shop.example.com/item?size=27",
  "https://example.com:443/item",
  "https://8.8.8.8/item",
  "https://1.1.1.1/item",
  "https://93.184.216.34/item",
  "https://www.rakuten.co.jp/shop/item",
  "https://store.shopping.yahoo.co.jp/example/item.html",
  "https://www.ebay.com/itm/123",
  "https://cdn.example.com/assets/shoe.webp",
] as const;

describe("provider URL HTTPS boundary", () => {
  it.each(unsafeUrls)("rejects unsafe or non-public URL %s", (url) => {
    expect(isSafePublicHttpsUrl(url)).toBe(false);
  });

  it.each(safeUrls)("accepts bounded public HTTPS URL %s", (url) => {
    expect(isSafePublicHttpsUrl(url)).toBe(true);
  });
});
