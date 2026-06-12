const BASE_FEEDS = [
  {
    source: "ITmedia",
    url: "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml"
  },
  {
    source: "Google News",
    topicKey: "mobility",
    query: "EV 自動車 企業 投資 OR 自動運転"
  },
  {
    source: "Google News",
    topicKey: "ai",
    query: "生成AI 企業 導入 業務効率化"
  },
  {
    source: "Google News",
    topicKey: "finance",
    query: "金利 企業 影響"
  },
  {
    source: "Google News",
    topicKey: "semiconductor",
    query: "半導体 投資 企業 サプライチェーン"
  },
  {
    source: "Google News",
    topicKey: "media",
    query: "サブスク 値上げ 動画配信"
  },
  {
    source: "Google News",
    topicKey: "creator",
    query: "フリーランス 取引条件 企業"
  },
  {
    source: "Google News",
    topicKey: "retail",
    query: "小売 物流 店舗 価格戦略 企業"
  },
  {
    source: "Google News",
    topicKey: "operations",
    query: "人手不足 省人化 物流 オペレーション 企業"
  },
  {
    source: "Google News",
    topicKey: "public",
    query: "経産省 白書 産業 企業 投資"
  }
];

function googleNewsUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
}

function buildFeeds(searchQuery = "") {
  const query = String(searchQuery || "").trim();
  let feeds = BASE_FEEDS.map((feed) => ({
    ...feed,
    url: feed.url || googleNewsUrl(feed.query)
  }));

  if (query) {
    const topicKey = inferTopicKey(query);
    feeds.unshift({
      source: "Google News",
      topicKey,
      url: googleNewsUrl(`${query} 企業 業界 OR 市場 OR 規制`)
    });
  }

  return shuffle(feeds).slice(0, 7);
}

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

function classifyTheme(text = "") {
  const value = text.toLowerCase();
  if (hasAny(value, ["ev", "電池", "半導体", "自動車", "自動運転", "waymo", "tsmc", "nvidia"])) return "メーカー・半導体";
  if (hasAny(value, ["ai", "生成ai", "dx", "llm", "openai", "データセンター"])) return "AI・テクノロジー";
  if (hasAny(value, ["金利", "為替", "物価", "日銀", "銀行", "金融"])) return "金融・金利・為替";
  if (hasAny(value, ["海外", "米国", "中国", "欧州", "関税", "輸出", "輸入"])) return "国際情勢";
  return "AI・テクノロジー";
}

function classifyMaterial(text = "") {
  const value = text.toLowerCase();
  if (hasAny(value, ["事例", "導入", "発表", "提携", "買収", "出資"])) return "企業事例";
  if (hasAny(value, ["市場", "拡大", "縮小", "変化", "投資", "需要", "価格"])) return "市場変化";
  if (hasAny(value, ["規制", "政策", "法", "政府", "公取委", "省"])) return "社会トレンド";
  return "業界知識";
}

function hasAny(value, words) {
  return words.some((word) => value.includes(word));
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function businessScore(item) {
  const value = `${item.title} ${item.theme} ${item.material}`.toLowerCase();
  let score = Math.random();
  if (hasAny(value, ["企業", "事業", "業界", "市場", "投資", "導入", "価格", "物流", "店舗", "需要", "供給", "半導体", "ev", "ai", "dx", "省人化", "人手不足"])) score += 4;
  if (hasAny(value, ["決算", "買収", "提携", "サプライチェーン", "オペレーション", "コスト", "生産", "設備"])) score += 3;
  if (hasAny(value, ["政府", "省", "白書", "統計", "規制", "公取委"])) score += 1.5;
  if (hasAny(value, ["選挙", "政党", "首相", "大統領", "国会", "外交", "軍事", "事件", "逮捕"])) score -= 5;
  return score;
}

function inferTopicKey(title = "") {
  const value = title.toLowerCase();
  const rules = [
    ["mobility", ["waymo", "自動運転", "ev", "自動車", "車", "タクシー", "ライドシェア", "uber"]],
    ["game", ["任天堂", "switch", "ゲーム", "プレイ時間", "購入制限", "nintendo"]],
    ["space", ["starlink", "amazon leo", "衛星", "宇宙", "通信"]],
    ["media", ["dazn", "サブスク", "動画", "配信", "月額", "課金"]],
    ["creator", ["kadokawa", "フリーランス", "ライター", "取引条件", "下請け"]],
    ["ai", ["生成ai", "ai", "llm", "openai", "google", "microsoft", "データセンター"]],
    ["finance", ["金利", "為替", "日銀", "銀行", "金融", "物価"]],
    ["semiconductor", ["半導体", "tsmc", "rapidus", "intel", "nvidia"]],
    ["retail", ["小売", "店舗", "消費", "価格", "物流"]]
  ];
  const found = rules.find(([, keywords]) => keywords.some((keyword) => value.includes(keyword)));
  return found ? found[0] : "";
}

function ageDays(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function parseItems(xml, source, topicKey = "") {
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
      material: classifyMaterial(title),
      topicKey: topicKey || inferTopicKey(title)
    };
  }).filter((item) => item.title && item.url && item.ageDays <= 7);
}

module.exports = async function handler(req, res) {
  try {
    const feeds = buildFeeds(req.query?.q || "");
    const settled = await Promise.allSettled(
      feeds.map(async (feed) => {
        const response = await fetch(feed.url, {
          headers: { "user-agent": "CaseMaterialDesk/1.0" }
        });
        if (!response.ok) return [];
        return parseItems(await response.text(), feed.source, feed.topicKey || "");
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
      .map((item) => ({ ...item, score: businessScore(item) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .sort(() => Math.random() - 0.5)
      .map(({ score, ...item }) => item);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({ articles });
  } catch (error) {
    res.status(500).json({ articles: [], error: "failed_to_fetch_articles" });
  }
};
