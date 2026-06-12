const FEEDS = [
  {
    source: "ITmedia",
    url: "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml"
  },
  {
    source: "Google News",
    url: "https://news.google.com/rss/search?q=EV%20%E6%8A%95%E8%B3%87%20%E6%97%A5%E6%9C%AC&hl=ja&gl=JP&ceid=JP:ja"
  },
  {
    source: "Google News",
    url: "https://news.google.com/rss/search?q=%E7%94%9F%E6%88%90AI%20%E4%BC%81%E6%A5%AD%20%E5%B0%8E%E5%85%A5&hl=ja&gl=JP&ceid=JP:ja"
  },
  {
    source: "Google News",
    url: "https://news.google.com/rss/search?q=%E9%87%91%E5%88%A9%20%E4%BC%81%E6%A5%AD%20%E5%BD%B1%E9%9F%BF&hl=ja&gl=JP&ceid=JP:ja"
  },
  {
    source: "Google News",
    url: "https://news.google.com/rss/search?q=%E5%8D%8A%E5%B0%8E%E4%BD%93%20%E6%8A%95%E8%B3%87%20%E4%BC%81%E6%A5%AD&hl=ja&gl=JP&ceid=JP:ja"
  }
];

function strip(value = "") {
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim();
}

function decodeXml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pick(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(strip(match[1])) : "";
}

function classifyTheme(text) {
  const value = text.toLowerCase();
  if (value.includes("ev") || value.includes("電池") || value.includes("半導体") || value.includes("自動車")) return "メーカー・半導体";
  if (value.includes("ai") || value.includes("生成ai") || value.includes("dx") || value.includes("llm")) return "AI・テクノロジー";
  if (value.includes("金利") || value.includes("為替") || value.includes("物価") || value.includes("日銀")) return "金融・金利・為替";
  if (value.includes("海外") || value.includes("米国") || value.includes("中国") || value.includes("欧州")) return "国際情勢";
  return "AI・テクノロジー";
}

function classifyMaterial(text) {
  const value = text.toLowerCase();
  if (value.includes("事例") || value.includes("導入") || value.includes("発表")) return "企業事例";
  if (value.includes("市場") || value.includes("拡大") || value.includes("変化") || value.includes("投資")) return "市場変化";
  if (value.includes("規制") || value.includes("政策") || value.includes("法")) return "社会トレンド";
  return "業界知識";
}

function ageDays(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function parseItems(xml, source) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return blocks.map((block) => {
    const title = pick(block, "title");
    const url = pick(block, "link");
    const publishedRaw = pick(block, "pubDate");
    const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString().slice(0, 10) : "";
    return {
      title,
      url,
      source,
      publishedAt,
      ageDays: ageDays(publishedRaw),
      theme: classifyTheme(title),
      material: classifyMaterial(title)
    };
  }).filter((item) => item.title && item.url && item.ageDays <= 7);
}

module.exports = async function handler(req, res) {
  try {
    const settled = await Promise.allSettled(
      FEEDS.map(async (feed) => {
        const response = await fetch(feed.url, {
          headers: { "user-agent": "CaseMaterialDesk/1.0" }
        });
        if (!response.ok) return [];
        return parseItems(await response.text(), feed.source);
      })
    );
    const seen = new Set();
    const articles = settled
      .flatMap((result) => result.status === "fulfilled" ? result.value : [])
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      })
      .slice(0, 30);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({ articles });
  } catch (error) {
    res.status(500).json({ articles: [], error: "failed_to_fetch_articles" });
  }
};
