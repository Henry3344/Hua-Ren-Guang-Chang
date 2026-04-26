import { US_STATE_CODE_TO_ZH } from '@/lib/locationMeta'

type CuratedCity = {
  city: string
  areas: string[]
  geoAliases?: string[]
  areaAliases?: Record<string, string[]>
}

type CuratedLocation = {
  state: string
  cities: CuratedCity[]
}

const curatedLocationData = [
  {
    state: '纽约州',
    cities: [
      {
        city: '皇后区',
        areas: ['法拉盛', '贝赛', '艾姆赫斯特'],
        geoAliases: ['Queens', 'Queens County'],
        areaAliases: {
          法拉盛: ['Flushing'],
          贝赛: ['Bayside'],
          艾姆赫斯特: ['Elmhurst'],
        },
      },
      {
        city: '布鲁克林区',
        areas: ['八大道', '日落公园', '本森赫斯特'],
        geoAliases: ['Brooklyn', 'Kings County'],
        areaAliases: {
          八大道: ['8th Avenue', 'Eighth Avenue'],
          日落公园: ['Sunset Park'],
          本森赫斯特: ['Bensonhurst'],
        },
      },
      { city: '曼哈顿区', areas: ['华埠'], geoAliases: ['Manhattan', 'New York County'], areaAliases: { 华埠: ['Chinatown'] } },
      { city: '长岛', areas: ['大颈', '杰瑞科'], geoAliases: ['Long Island', 'Nassau County'], areaAliases: { 大颈: ['Great Neck'], 杰瑞科: ['Jericho'] } },
      { city: '纽约上州', areas: [], geoAliases: ['Albany', 'Buffalo', 'Rochester', 'Syracuse'] },
    ],
  },
  {
    state: '新泽西州',
    cities: [
      { city: '卑尔根县', areas: ['李堡', '埃奇沃特'], geoAliases: ['Bergen County'], areaAliases: { 李堡: ['Fort Lee'], 埃奇沃特: ['Edgewater'] } },
      { city: '密德萨克斯县', areas: ['爱迪生'], geoAliases: ['Middlesex County'], areaAliases: { 爱迪生: ['Edison'] } },
      { city: '纽瓦克都会区', areas: [], geoAliases: ['Newark', 'Essex County'] },
      { city: '泽西城都会区', areas: [], geoAliases: ['Jersey City', 'Hudson County'] },
      { city: '普林斯顿都会区', areas: [], geoAliases: ['Princeton', 'Mercer County'] },
    ],
  },
  {
    state: '加利福尼亚州',
    cities: [
      {
        city: '洛杉矶都会区',
        areas: ['蒙特利公园', '阿凯迪亚', '圣马力诺', '罗兰岗', '哈岗', '尔湾', '新港滩'],
        geoAliases: ['Los Angeles', 'Los Angeles County', 'Orange County'],
        areaAliases: {
          蒙特利公园: ['Monterey Park'],
          阿凯迪亚: ['Arcadia'],
          圣马力诺: ['San Marino'],
          罗兰岗: ['Rowland Heights'],
          哈岗: ['Hacienda Heights'],
          尔湾: ['Irvine'],
          新港滩: ['Newport Beach'],
        },
      },
      {
        city: '旧金山湾区',
        areas: ['库珀蒂诺', '桑尼维尔', '圣荷西', '弗里蒙特', '旧金山列治文区', '旧金山日落区'],
        geoAliases: ['San Francisco', 'San Jose', 'Bay Area', 'Santa Clara County', 'Alameda County', 'San Mateo County'],
        areaAliases: {
          库珀蒂诺: ['Cupertino'],
          桑尼维尔: ['Sunnyvale'],
          圣荷西: ['San Jose'],
          弗里蒙特: ['Fremont'],
          旧金山列治文区: ['Richmond District'],
          旧金山日落区: ['Sunset District'],
        },
      },
      { city: '圣地亚哥都会区', areas: [], geoAliases: ['San Diego', 'San Diego County'] },
      { city: '萨克拉门托都会区', areas: [], geoAliases: ['Sacramento', 'Sacramento County'] },
      { city: '中加州', areas: [], geoAliases: ['Fresno', 'Bakersfield', 'Stockton', 'Modesto'] },
    ],
  },
  {
    state: '德克萨斯州',
    cities: [
      { city: '休斯顿都会区', areas: ['糖城', '凯蒂'], geoAliases: ['Houston', 'Harris County'], areaAliases: { 糖城: ['Sugar Land'], 凯蒂: ['Katy'] } },
      { city: '达拉斯都会区', areas: ['普莱诺', '弗里斯科'], geoAliases: ['Dallas', 'Fort Worth', 'DFW', 'Dallas County', 'Collin County'], areaAliases: { 普莱诺: ['Plano'], 弗里斯科: ['Frisco'] } },
      { city: '奥斯汀都会区', areas: ['圆石城', '域蓝'], geoAliases: ['Austin', 'Travis County'], areaAliases: { 圆石城: ['Round Rock'], 域蓝: ['Pflugerville'] } },
      { city: '圣安东尼奥都会区', areas: [], geoAliases: ['San Antonio', 'Bexar County'] },
    ],
  },
  {
    state: '华盛顿州',
    cities: [
      { city: '西雅图都会区', areas: ['贝尔维尤', '雷德蒙德', '柯克兰'], geoAliases: ['Seattle', 'King County'], areaAliases: { 贝尔维尤: ['Bellevue'], 雷德蒙德: ['Redmond'], 柯克兰: ['Kirkland'] } },
      { city: '塔科马都会区', areas: [], geoAliases: ['Tacoma', 'Pierce County'] },
      { city: '斯波坎都会区', areas: [], geoAliases: ['Spokane', 'Spokane County'] },
    ],
  },
  {
    state: '内华达州',
    cities: [
      { city: '拉斯维加斯都会区', areas: ['春之谷'], geoAliases: ['Las Vegas', 'Clark County'], areaAliases: { 春之谷: ['Spring Valley'] } },
      { city: '雷诺都会区', areas: [], geoAliases: ['Reno', 'Washoe County'] },
    ],
  },
  {
    state: '北卡罗来纳州',
    cities: [
      { city: '罗利-达勒姆都会区', areas: ['卡瑞'], geoAliases: ['Raleigh', 'Durham', 'Research Triangle', 'Wake County'], areaAliases: { 卡瑞: ['Cary'] } },
      { city: '夏洛特都会区', areas: [], geoAliases: ['Charlotte', 'Mecklenburg County'] },
    ],
  },
  {
    state: '伊利诺伊州',
    cities: [
      { city: '芝加哥都会区', areas: ['内珀维尔', '桥港区'], geoAliases: ['Chicago', 'Cook County'], areaAliases: { 内珀维尔: ['Naperville'], 桥港区: ['Bridgeport'] } },
      { city: '香槟-厄巴纳都会区', areas: [], geoAliases: ['Champaign', 'Urbana'] },
    ],
  },
  {
    state: '佐治亚州',
    cities: [
      { city: '亚特兰大都会区', areas: ['约翰斯克里克', '杜鲁斯'], geoAliases: ['Atlanta', 'Fulton County', 'Gwinnett County'], areaAliases: { 约翰斯克里克: ['Johns Creek'], 杜鲁斯: ['Duluth'] } },
      { city: '萨凡纳都会区', areas: [], geoAliases: ['Savannah', 'Chatham County'] },
    ],
  },
  {
    state: '马萨诸塞州',
    cities: [
      { city: '波士顿都会区', areas: ['摩顿', '昆西', '布鲁克莱恩'], geoAliases: ['Boston', 'Suffolk County', 'Middlesex County'], areaAliases: { 摩顿: ['Malden'], 昆西: ['Quincy'], 布鲁克莱恩: ['Brookline'] } },
      { city: '伍斯特都会区', areas: [], geoAliases: ['Worcester'] },
    ],
  },
  { state: '佛罗里达州', cities: [
    { city: '迈阿密都会区', areas: [], geoAliases: ['Miami', 'Miami-Dade County', 'Fort Lauderdale', 'Broward County'] },
    { city: '奥兰多都会区', areas: [], geoAliases: ['Orlando', 'Orange County'] },
    { city: '坦帕湾都会区', areas: [], geoAliases: ['Tampa', 'St. Petersburg', 'Hillsborough County'] },
  ] },
  { state: '宾夕法尼亚州', cities: [
    { city: '费城都会区', areas: [], geoAliases: ['Philadelphia', 'Philadelphia County'] },
    { city: '匹兹堡都会区', areas: [], geoAliases: ['Pittsburgh', 'Allegheny County'] },
  ] },
  { state: '亚利桑那州', cities: [
    { city: '凤凰城都会区', areas: [], geoAliases: ['Phoenix', 'Scottsdale', 'Mesa', 'Maricopa County'] },
    { city: '图森都会区', areas: [], geoAliases: ['Tucson', 'Pima County'] },
  ] },
  { state: '俄亥俄州', cities: [
    { city: '哥伦布都会区', areas: [], geoAliases: ['Columbus', 'Franklin County'] },
    { city: '克利夫兰都会区', areas: [], geoAliases: ['Cleveland', 'Cuyahoga County'] },
    { city: '辛辛那提都会区', areas: [], geoAliases: ['Cincinnati', 'Hamilton County'] },
  ] },
  { state: '密歇根州', cities: [
    { city: '底特律都会区', areas: [], geoAliases: ['Detroit', 'Wayne County', 'Oakland County'] },
    { city: '安娜堡都会区', areas: [], geoAliases: ['Ann Arbor', 'Washtenaw County'] },
  ] },
  { state: '明尼苏达州', cities: [
    { city: '明尼阿波利斯-圣保罗都会区', areas: [], geoAliases: ['Minneapolis', 'Saint Paul', 'St. Paul', 'Hennepin County', 'Ramsey County'] },
  ] },
  { state: '科罗拉多州', cities: [
    { city: '丹佛都会区', areas: [], geoAliases: ['Denver', 'Aurora', 'Lakewood'] },
    { city: '博尔德都会区', areas: [], geoAliases: ['Boulder'] },
  ] },
  { state: '弗吉尼亚州', cities: [
    { city: '北弗吉尼亚都会区', areas: [], geoAliases: ['Fairfax County', 'Arlington', 'Alexandria', 'Loudoun County'] },
    { city: '里士满都会区', areas: [], geoAliases: ['Richmond', 'Henrico County'] },
  ] },
  { state: '马里兰州', cities: [
    { city: '大华府马里兰区', areas: [], geoAliases: ['Montgomery County', 'Rockville', 'Gaithersburg'] },
    { city: '巴尔的摩都会区', areas: [], geoAliases: ['Baltimore', 'Baltimore County'] },
  ] },
  { state: '俄勒冈州', cities: [
    { city: '波特兰都会区', areas: [], geoAliases: ['Portland', 'Multnomah County', 'Beaverton'] },
  ] },
  { state: '田纳西州', cities: [
    { city: '纳什维尔都会区', areas: [], geoAliases: ['Nashville', 'Davidson County'] },
    { city: '孟菲斯都会区', areas: [], geoAliases: ['Memphis', 'Shelby County'] },
  ] },
  { state: '犹他州', cities: [
    { city: '盐湖城都会区', areas: [], geoAliases: ['Salt Lake City', 'Salt Lake County'] },
  ] },
  { state: '康涅狄格州', cities: [
    { city: '哈特福德都会区', areas: [], geoAliases: ['Hartford'] },
    { city: '纽黑文都会区', areas: [], geoAliases: ['New Haven'] },
  ] },
  { state: '夏威夷州', cities: [
    { city: '檀香山都会区', areas: [], geoAliases: ['Honolulu', 'Oahu'] },
  ] },
  { state: '华盛顿特区', cities: [
    { city: '华盛顿特区', areas: [], geoAliases: ['Washington', 'District of Columbia'] },
  ] },
] satisfies CuratedLocation[]

const curatedStates = new Set(curatedLocationData.map((item) => item.state))

export const locationData = [
  ...curatedLocationData,
  ...Object.values(US_STATE_CODE_TO_ZH)
    .filter((state) => !curatedStates.has(state))
    .map((state) => ({ state, cities: [] })),
]

function normalizeGeoText(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function geoTextMatches(candidate: string, alias: string) {
  const c = normalizeGeoText(candidate)
  const a = normalizeGeoText(alias)
  return c === a || c.includes(a) || a.includes(c)
}

export function matchLocationFromGeo(
  stateZh: string,
  candidates: Array<string | undefined | null>,
): { city: string; area: string } {
  const state = locationData.find((item) => item.state === stateZh)
  if (!state) return { city: '', area: '' }

  const parts = candidates
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
  if (!parts.length) return { city: '', area: '' }

  for (const city of state.cities) {
    for (const [area, aliases] of Object.entries(city.areaAliases || {})) {
      if (aliases.some((alias) => parts.some((part) => geoTextMatches(part, alias)))) {
        return { city: city.city, area }
      }
    }
  }

  for (const city of state.cities) {
    const aliases = [city.city, ...(city.geoAliases || [])]
    if (aliases.some((alias) => parts.some((part) => geoTextMatches(part, alias)))) {
      return { city: city.city, area: '' }
    }
  }

  return { city: '', area: '' }
}

export type LocationData = typeof locationData
