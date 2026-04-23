import type { Metadata } from 'next'
import Link from 'next/link'
import DocPageShell from '@/components/DocPageShell'
import type { DocTocItem } from '@/components/DocToc'

export const metadata: Metadata = {
  title: '广告合作',
  description:
    '了解华人广场平台受众、分类信息场景、AI 自然语言检索、信用分与认证体系，以及多种广告位组合投放方案，评估在本站投放广告的价值与路径。',
}

const TOC: DocTocItem[] = [
  { id: 'ad-sec-1', label: '一、聚焦在美华人社区' },
  { id: 'ad-sec-2', label: '二、分类信息 = 高纯度意图场景' },
  { id: 'ad-sec-3', label: '三、AI 自然语言检索与赞助位' },
  { id: 'ad-sec-4', label: '四、信用分与认证体系抬升可信度' },
  { id: 'ad-sec-5', label: '五、多版位组合投放' },
  { id: 'ad-sec-6', label: '六、地区颗粒度：同城 / 同州 / 全美' },
  { id: 'ad-sec-7', label: '七、透明合规与数据回收' },
  { id: 'ad-sec-8', label: '八、持续迭代与反馈渠道' },
]

export default function AdvertisingPage() {
  return (
    <DocPageShell toc={TOC}>
      <article className="prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground">
        <header className="not-prose mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">为什么在本站投放广告？</h1>
          <p className="text-xs text-muted-foreground">
            以下为平台优势说明，供您评估投放决策；具体刊例、版位规则与合作方式以商务沟通为准。
          </p>
          <p className="text-xs text-muted-foreground mt-2">最后更新：2026年4月</p>
        </header>

        <section id="ad-sec-1" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">一、聚焦在美华人社区</h2>
          <p>
            「华人广场」面向
            <strong className="text-foreground">美国华人</strong>
            用户，覆盖租房、找房、招聘、找工、二手闲置与本地商家等高频需求。相较于综合门户或社交平台的「泛流量」，本站的访问多与某条具体的生活决策（找房、换工作、添置家电、挑选本地服务）直接相关，广告与用户原本正在做的事高度一致，更容易触达
            <strong className="text-foreground">有真实需求、愿意联系与到店</strong>
            的受众。
          </p>
        </section>

        <section id="ad-sec-2" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">二、分类信息 = 高纯度意图场景</h2>
          <p>
            站内按「<em>租房 / 找房 / 招聘 / 找工 / 二手</em>」五大类 + 数十个子类组织帖子，并且把「房东帖」与「求租帖」、「雇主招人」与「求职者」分别放在独立栏目——访客一进入列表页，浏览路径就已经高度收敛。您的品牌或门店出现在首页、分类列表或帖子详情周边时，面对的是
            <strong className="text-foreground">明确知道自己要什么</strong>
            的用户，而不是「顺手刷到的人」。
          </p>
        </section>

        <section id="ad-sec-3" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">三、AI 自然语言检索与赞助位</h2>
          <p>
            本站是少见的在分类信息上自建「
            <Link href="/ai-search" className="text-primary hover:underline">
              AI 自然语言助手
            </Link>
            」并与广告体系打通的平台：
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              用户可用口语描述需求（如「两室一厅 2000 以内、可短租 2 个月」「三星 s23 便宜一点的」「找份餐饮工」），系统自动抽取
              <strong className="text-foreground">分类、子类、价位区间、品牌 / 型号、地区</strong>
              等意图，再做分级放宽与相关子类引导。
            </li>
            <li>
              进入 AI 对话页面的用户，往往是
              <strong className="text-foreground">需求更具体、停留更长</strong>
              、且愿意把问题完整表达出来的访客；这类流量的商业价值明显高于首次跳转的通用流量。
            </li>
            <li>
              AI 助手结果列表内置一个
              <strong className="text-foreground">赞助单卡位</strong>
              ，明确标注「赞助」与来源说明，并对用户所问的大类做
              <strong className="text-foreground">兼容过滤</strong>
              （例如用户在问「车位出租」时，不会被强行插入无关二手帖），兼顾曝光效果与用户体验。
            </li>
          </ul>
        </section>

        <section id="ad-sec-4" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">四、信用分与认证体系抬升可信度</h2>
          <p>
            平台内置
            <strong className="text-foreground">0–100 分用户信用分</strong>
            、举报与审核流程，以及
            <strong className="text-foreground">商家入驻 + 营业执照审核</strong>
            形成的认证商家体系：
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              严重违规 / 被举报查实的账号会扣分并限制发帖，归零将封禁并下架相关内容，减少低质与诈骗信息对用户浏览体验的侵蚀。规则详见
              <Link href="/credit" className="text-primary hover:underline">
                《信用分机制说明》
              </Link>
              。
            </li>
            <li>
              认证商家会展示在
              <Link href="/yellowpages" className="text-primary hover:underline">
                商家黄页
              </Link>
              ，并在站内带有识别标识；您以广告主或认证商家身份出现，与平台的「可信社区」定位相互加持，有助于建立第一印象与咨询意愿。
            </li>
          </ul>
          <p className="text-xs">
            具体展示规则以实际上线与审核政策为准，认证不代表本平台对商家服务质量或交易结果作出担保。
          </p>
        </section>

        <section id="ad-sec-5" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">五、多版位组合投放</h2>
          <p>站内共有多类广告位，可按阶段与目标灵活组合：</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">首页位（HOME）：</strong>
              顶部 / 底部的横幅与侧边位，适合需要广覆盖与品牌曝光的长期投放。
            </li>
            <li>
              <strong className="text-foreground">分类列表位（CATEGORY）：</strong>
              租房、招聘、二手等分类页顶部 / 底部位以及列表信息流中的 INLINE 位，适合按人群行为（正在找房 / 找工 / 找物品）的精准投放。
            </li>
            <li>
              <strong className="text-foreground">帖子详情位（POST）：</strong>
              帖子正文周边的伴随位，接触的是已经深度阅读单条信息、处于「即将联系」阶段的用户。
            </li>
            <li>
              <strong className="text-foreground">AI 助手赞助位：</strong>
              AI 对话结果中的单卡推荐位，自带标注与大类兼容过滤，适合高意图场景下的导流。
            </li>
            <li>
              <strong className="text-foreground">置顶与商家入驻：</strong>
              商家可通过置顶（付费 Pin）、黄页入驻、资料审核等流程稳定出现在目标分类，作为长期品牌阵地。
            </li>
          </ul>
          <p className="text-xs">
            版位规格、样式与素材规范以实际上线的广告管理页与商务确认函为准。
          </p>
        </section>

        <section id="ad-sec-6" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">六、地区颗粒度：同城 / 同州 / 全美</h2>
          <p>
            站内支持「<em>全站 · 全州 · 城市 · 片区</em>」四级地区切换，您可按门店服务半径选择投放范围：
            <strong className="text-foreground">本地门店</strong>
            可聚焦到城市或片区，减少无关曝光；
            <strong className="text-foreground">区域性 / 连锁品牌</strong>
            可选同一州，覆盖多个都市圈；
            <strong className="text-foreground">全美品牌</strong>
            可做全站投放并配合分类列表位精细化。
          </p>
        </section>

        <section id="ad-sec-7" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">七、透明合规与数据回收</h2>
          <p>
            所有赞助位与置顶位均明确标注「赞助 / 推广」字样，并在 AI 助手答句中主动说明其为商业展示位，避免与自然结果混淆。站内对展示、点击等事件做基础记录（详见
            <Link href="/privacy" className="text-primary hover:underline">
              《隐私声明》
            </Link>
            ），可与您对齐投放报告口径；平台立场
            <strong className="text-foreground">不作交易担保</strong>
            ，具体服务质量由广告主自行负责。
          </p>
        </section>

        <section id="ad-sec-8" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">八、持续迭代与反馈渠道</h2>
          <p>
            产品功能与流量策略会持续优化（包括 AI 检索与排序、分类结构、反诈骗风控等）；合作期间可通过
            <Link href="/merchant" className="text-primary hover:underline">
              商家中心
            </Link>
            或邮件与我们沟通投放目标、素材规范与数据反馈，便于双方对齐预期。
          </p>
        </section>

        <section
          className="not-prose rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 text-xs leading-relaxed text-muted-foreground"
          aria-label="下一步操作"
        >
          <p>
            若您已准备好投放或希望了解版位与报价，可从站内招租位进入「申请在此展示广告」，或前往{' '}
            <Link
              href="/merchant"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              商家与广告相关页面
            </Link>
            ，或直接邮件联系{' '}
            <a
              href="mailto:admin@antiscamhelper.uk"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              admin@antiscamhelper.uk
            </a>
            ，我们将尽快回复。
          </p>
        </section>
      </article>
    </DocPageShell>
  )
}
