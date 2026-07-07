import type { RyoModeAnswers, RyoParentModelProfile, RyoPreferenceVector } from "./types";

const profiles: RyoParentModelProfile[] = [
  profile("converse_one_star", "Converse One Star / Star & Bars", "S_PLUS",
    ["Converse One Star J", "Converse One Star J VTG", "Converse One Star Leather", "Converse One Star Suede"],
    ["One Star J", "One Star J VTG", "One Star Leather", "One Star Suede"], [], [],
    ["1970s Converse", "一つ星のシンプルさ"], ["skate", "grunge", "vintage"], ["alternative rock", "hip hop"],
    ["amekaji", "street"], ["suede fading", "leather creasing"], ["denim", "work pants"],
    ["一つ星の簡潔さと素材の経年変化を、古着やデニムへ馴染ませやすい親モデルです"], []),
  profile("converse_all_star_j", "Converse All Star J / VTG / TimeLine / Addict", "S_PLUS",
    ["Converse All Star J Hi", "Converse All Star J VTG", "Converse TimeLine", "Converse Addict Chuck Taylor Hi"],
    ["All Star J Hi", "All Star J VTG", "TimeLine", "Addict Chuck Taylor Hi"], ["All Star OX"], ["All Star / Chuck Taylor"],
    ["Made in Japan", "vintage specification", "high cut"], ["amekaji", "vintage", "workwear"], ["rock", "punk"],
    ["amekaji"], ["canvas fading"], ["denim", "work pants"],
    ["通常現行ではなく、日本製・復刻・上位仕様とHiカットの履き込み価値を評価します"], ["通常現行All Starは便利な定番ですがRyo Modeの本命扱いにはしません"]),
  profile("converse_jack_purcell", "Converse Jack Purcell CL / 1935 / Leather", "S_PLUS",
    ["Converse Jack Purcell CL", "Converse Jack Purcell 1935", "Converse Jack Purcell Leather"],
    ["Jack Purcell CL", "Jack Purcell 1935", "Jack Purcell Leather"], ["Jack Purcell"], [],
    ["badminton heritage", "smile toe"], ["clean casual", "quiet classic"], ["indie", "jazz"],
    ["normcore", "clean casual", "amekaji"], ["leather creasing", "canvas fading"], ["straight pants", "denim", "chino", "clean slacks"],
    ["スマイルとヒゲを持つ静かな定番で、CLは買いやすさ、1935は思想、Leatherは大人の育て枠です"], []),
  profile("adidas_archive", "adidas Archive / Terrace / City Series", "S",
    ["adidas Tobacco", "adidas London", "adidas Hamburg", "adidas Spezial", "adidas Country OG", "adidas Japan", "adidas Gazelle Indoor", "adidas BW Army", "adidas Superstar Vintage"],
    ["Tobacco", "London", "Hamburg", "Spezial", "Country OG", "Japan", "BW Army", "Superstar Vintage Made in Germany"], ["Samba OG", "Gazelle Indoor"], ["Samba"],
    ["terrace", "city series", "archive training"], ["UK casual", "football terrace"], ["britpop", "soul"],
    ["clean casual", "amekaji"], ["suede fading", "leather creasing"], ["slim pants", "straight pants", "denim"],
    ["Samba一択にせずTobacco、London、Hamburg、Spezial、Country、Japanまでアーカイブを広げます"], ["Sambaは良い靴ですが流行だけを理由に上位固定しません"]),
  profile("puma_suede_clyde", "PUMA Suede / Clyde / Brasil", "S",
    ["PUMA Suede", "PUMA Clyde", "PUMA Brasil"], ["Suede VTG", "Suede MIJ", "Clyde MIJ", "Brasil"], [], ["Speedcat"],
    ["basketball", "track and field"], ["B-boy", "NBA", "hip hop"], ["hip hop", "funk"],
    ["amekaji", "street", "skate"], ["suede fading and nap"], ["denim", "work pants", "wide pants"],
    ["スエードの育ちとB-boy・NBAの背景がデニムやワークパンツに馴染みます"], ["SpeedcatはRyo Modeの中心には置きません"]),
  profile("nike_jordan_heritage", "Nike / Jordan Heritage", "S",
    ["Nike Air Jordan 1 High", "Nike Blazer", "Nike Terminator", "Converse Weapon", "Converse Pro Leather"],
    ["Air Jordan 1 High 85", "Blazer Mid 77", "Terminator High", "Pro Leather"], ["Air Jordan 1 Low", "Dunk SB", "Air Force 1 Low"], ["Air Force 1 Low White/White"],
    ["basketball heritage"], ["NBA", "college basketball", "street"], ["hip hop"],
    ["amekaji", "street"], ["leather creasing"], ["denim", "work pants", "wide pants"],
    ["競技背景、革のシワ、履き込み、裾との相性をモデル単位で評価します"], ["AF1 White/Whiteは汎用定番で、アメカジRyo Strongの主軸ではありません"]),
  profile("nike_retro_running_archive", "Nike Retro Running / Archive", "S",
    ["Nike Cortez", "Nike LD-1000", "Nike Astro Grabber", "Nike Waffle Trainer", "Nike Daybreak", "Nike Field General"],
    ["Cortez Leather", "Cortez Forrest Gump", "LD-1000", "Astro Grabber"], [], ["Air Max 95"],
    ["1970s running", "waffle sole"], ["heritage sportswear"], ["classic rock", "soul"],
    ["amekaji", "clean casual", "normcore"], ["nylon and suede aging", "leather creasing"], ["denim", "chino", "straight pants", "slim pants"],
    ["古いNikeスポーツの薄い形を、デニムやチノへ合わせるレトロランニング軸です"], ["Air Max 95はhigh-tech runningとして別枠で扱います"]),
  profile("vans_skate", "Vans Skate Classics", "S",
    ["Vans Authentic", "Vans Era", "Vans Half Cab"], ["Authentic LX", "Era 95", "Half Cab Premium Reissue"], ["Slip-On", "Old Skool", "Knu Skool"], ["Knu Skool"],
    ["California skate", "DIY"], ["skate", "punk"], ["punk", "hardcore"],
    ["amekaji", "street", "skate"], ["canvas fading", "suede fading"], ["denim", "work pants"],
    ["履き潰して完成するキャンバスとスエード、skate・punk・DIYの背景を評価します"], ["Knu Skoolは現代寄りなので条件付きです"]),
  profile("new_balance_premium_runner", "New Balance Premium Runner", "S",
    ["New Balance 990v3", "New Balance 990v4", "New Balance 991", "New Balance 993", "New Balance 998", "New Balance 1500", "New Balance 1300", "New Balance 1400", "New Balance 576"],
    ["990v3", "990v4", "991", "993", "998", "1500"], ["2002R", "2010", "574"], ["990v5", "990v6", "1906", "9060", "1000"],
    ["premium running"], ["Made in USA", "Made in UK"], ["indie", "jazz"],
    ["normcore", "clean casual"], ["suede and mesh aging"], ["wide slacks", "cargo", "denim"],
    ["991、998、1500、990v3-v4を高評価し、スエードとメッシュの質感を見ます"], ["大きなNや現代感が強いモデルはRyo中心から下げます"]),
  profile("reebok_prokeds_lastresort", "Reebok / PRO-Keds / Last Resort AB", "A",
    ["Reebok Classic Leather", "Reebok Classic Nylon", "Reebok Club C", "PRO-Keds Royal Plus", "Last Resort AB VM001"],
    ["Classic Leather 1983 Vintage", "Royal Plus Suede Hi", "VM001"], ["Club C"], [],
    ["1980s running", "classic tennis", "old basketball", "independent skate"], ["New York", "DIY", "heritage sportswear"], ["early hip hop", "punk"],
    ["normcore", "amekaji", "skate"], ["leather creasing", "suede fading"], ["straight pants", "denim", "work pants"],
    ["Classic Leatherは80s leather runner、Club Cはclassic tennisとして区別します"], ["Club Cをretro runningとは説明しません"]),
];

export function getRyoParentModelProfiles(): RyoParentModelProfile[] {
  return profiles.map((item) => ({ ...item, coreModels: [...item.coreModels], preferredVariants: [...item.preferredVariants], conditionalVariants: [...item.conditionalVariants], downrankVariants: [...item.downrankVariants] }));
}

export function findRyoParentModelProfile(candidateName: string): RyoParentModelProfile | undefined {
  const name = normalize(candidateName);
  const id = name.includes("one star") ? "converse_one_star"
    : /all star|chuck taylor|converse addict/.test(name) ? "converse_all_star_j"
      : name.includes("jack purcell") ? "converse_jack_purcell"
        : name.startsWith("adidas ") ? "adidas_archive"
          : /^puma (suede|clyde|brasil|speedcat)/.test(name) ? "puma_suede_clyde"
            : /^nike (cortez|ld 1000|astro grabber|moon shoe|waffle trainer|daybreak|field general)/.test(name) ? "nike_retro_running_archive"
              : /air jordan 1|nike (blazer|terminator|dunk|air force 1)|converse (weapon|pro leather)/.test(name) ? "nike_jordan_heritage"
                : name.startsWith("vans ") ? "vans_skate"
                  : name.startsWith("new balance ") ? "new_balance_premium_runner"
                    : /^(reebok|pro keds|last resort ab) /.test(name) ? "reebok_prokeds_lastresort" : undefined;
  return id ? profiles.find((item) => item.id === id) : undefined;
}

export function scoreRyoParentModelAffinity(candidate: string | { name: string }, vector: RyoPreferenceVector, _answers?: RyoModeAnswers): number {
  const name = typeof candidate === "string" ? candidate : candidate.name;
  const parent = findRyoParentModelProfile(name);
  if (!parent) return 0;
  let score = parent.priority === "S_PLUS" ? 76 : parent.priority === "S" ? 68 : parent.priority === "A" ? 56 : 44;
  const knownVariant = matchesAny(name, [...parent.coreModels, ...parent.preferredVariants, ...parent.conditionalVariants, ...parent.downrankVariants]);
  if (!knownVariant) score -= 25;
  if (matchesAny(name, parent.coreModels)) score += 7;
  if (matchesAny(name, parent.preferredVariants)) score += 12;
  if (matchesAny(name, parent.conditionalVariants)) score -= 5;
  if (matchesAny(name, parent.downrankVariants)) score -= 22;
  score += contextBonus(parent.id, name, vector);
  return clamp(score);
}

export function buildParentModelExplanation(candidate: string | { name: string }, profile: RyoParentModelProfile): string {
  const name = typeof candidate === "string" ? candidate : candidate.name;
  if (profile.id === "converse_all_star_j") {
    return /\b(J|VTG|TimeLine|Addict)\b/i.test(name)
      ? "通常現行ではなく、日本製・VTG・TimeLine・Addictの上位仕様として、Hiカットとキャンバスの退色、デニムとの相性を評価します。"
      : "通常現行All Starは便利な定番ですが、Ryo ModeではJ Hi・J VTG・TimeLine・Addict Hiを優先します。";
  }
  if (profile.id === "converse_one_star") return "一つ星のシンプルさ、スエードの毛並み変化、デニムや古着との相性、skate・grungeの70s文脈を評価します。";
  if (profile.id === "converse_jack_purcell") return /1935/i.test(name) ? "1935は思想枠。スマイルとヒゲを持つ静かな上品さを評価します。" : /leather/i.test(name) ? "Leatherは大人の育て枠。革の沈みとシワを評価します。" : "CLは買いやすい現行本命。スマイルとヒゲの静かな上品さを評価します。";
  return profile.ryoReasons[0] ?? `${profile.label}の文化的背景を評価します。`;
}

function contextBonus(id: RyoParentModelProfile["id"], name: string, v: RyoPreferenceVector): number {
  const n = normalize(name);
  switch (id) {
    case "converse_one_star": return points(v.style.amekaji, v.pantsFit.denim, v.pantsFit.workPants, v.materialAging.suedeFadingNap) + (/suede|vtg|\bj\b/.test(n) ? 7 : 0);
    case "converse_all_star_j": return points(v.style.amekaji, v.pantsFit.denim, v.materialAging.canvasFading, v.cut.high) + (/\b(j|vtg|timeline|addict)\b/.test(n) ? 9 : -8);
    case "converse_jack_purcell": return points(v.style.normcore, v.style.cleanCasual, v.pantsFit.straightPants, v.materialAging.leatherSinking);
    case "adidas_archive": return points(v.style.cleanCasual, v.pantsFit.slimPants, v.pantsFit.straightPants, v.sportOrigin.football) + (/samba/.test(n) ? -8 : 4);
    case "puma_suede_clyde": return points(v.style.amekaji, v.style.street, v.pantsFit.denim, v.pantsFit.workPants, v.materialAging.suedeFadingNap) + (/speedcat/.test(n) ? -18 : 0);
    case "nike_jordan_heritage": return points(v.style.amekaji, v.style.street, v.sportOrigin.basketball, v.materialAging.leatherCreasing) + (/air force 1/.test(n) && v.style.amekaji > 0 ? -12 : 0);
    case "nike_retro_running_archive": return points(v.style.amekaji, v.style.cleanCasual, v.pantsFit.denim, v.pantsFit.slimPants, v.techTolerance.avoidTech);
    case "vans_skate": return points(v.style.amekaji, v.style.street, v.sportOrigin.skate, v.pantsFit.workPants, v.materialAging.canvasFading) + (/knu skool/.test(n) ? -12 : 0);
    case "new_balance_premium_runner": return points(v.budget.premiumOk, v.style.normcore, v.sportOrigin.running) + (/990v[56]|1906|9060|1000/.test(n) ? -20 : 0);
    case "reebok_prokeds_lastresort": return points(v.style.normcore, v.pantsFit.straightPants, v.pantsFit.workPants, v.materialAging.leatherSinking);
  }
}

function points(...values: number[]): number { return values.filter((value) => value > 0).length * 4; }
function matchesAny(name: string, values: readonly string[]): boolean { const n = normalize(name); return values.some((value) => n.includes(normalize(value))); }
function normalize(value: string): string { return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim(); }
function clamp(value: number): number { return Math.max(0, Math.min(100, Math.round(value))); }

function profile(
  id: RyoParentModelProfile["id"], label: string, priority: RyoParentModelProfile["priority"], coreModels: string[], preferredVariants: string[], conditionalVariants: string[], downrankVariants: string[], originSignals: string[], cultureSignals: string[], musicSignals: string[], styleSignals: string[], materialAgingSignals: string[], pantsSignals: string[], ryoReasons: string[], cautions: string[],
): RyoParentModelProfile {
  return { id, label, priority, coreModels, preferredVariants, conditionalVariants, downrankVariants, originSignals, cultureSignals, musicSignals, styleSignals, materialAgingSignals, pantsSignals, ryoReasons, cautions };
}
