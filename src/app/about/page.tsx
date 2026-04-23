import Link from 'next/link'
import DocPageShell from '@/components/DocPageShell'
import type { DocTocItem } from '@/components/DocToc'

const TOC: DocTocItem[] = [
  { id: 'about-sec-1', label: '一、平台定位' },
  { id: 'about-sec-2', label: '二、网站与产品特性' },
  { id: 'about-sec-3', label: '三、服务范围与限制' },
  { id: 'about-sec-4', label: '四、用户责任与合规' },
  { id: 'about-sec-5', label: '五、知识产权与内容授权' },
  { id: 'about-sec-6', label: '六、风险提示' },
  { id: 'about-sec-7', label: '七、联系方式与运营主体' },
]

export default function AboutPage() {
  return (
    <DocPageShell toc={TOC}>
      <article className="prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground scroll-smooth">
        <h1 className="text-2xl font-bold text-foreground mb-2">关于我们</h1>
        <p className="text-xs text-muted-foreground mb-8">最后更新：2026年4月</p>

        <section id="about-sec-1" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">一、平台定位</h2>
          <p>
            「华人广场」（以下简称「本平台」）系面向美国华人社区的
            <strong className="text-foreground">信息发布与展示</strong>
            服务平台，为用户提供租房、招聘、二手交易、本地商家等分类信息的浏览与发布入口。本平台
            <strong className="text-foreground">并非</strong>
            交易中介、房产经纪、人力资源服务机构或商品销售方。
          </p>
          <p>
            本平台
            <strong className="text-foreground">不参与、不介入</strong>
            用户之间的任何交易行为，不对交易的达成、履行、争议处理或结果承担任何责任；亦
            <strong className="text-foreground">不对用户、帖子或第三方服务提供任何形式的背书、担保或代收代付</strong>
            。站内所有展示、排序、置顶、推荐或 AI 辅助检索等机制均为产品功能，不构成本平台对具体内容或交易对手方的推荐或保证。
          </p>
          <p>
            我们希望把「贴吧式自由发帖」与「结构化分类检索 + AI 自然语言辅助」结合起来，让身处美国的华人用户可以用自己熟悉的语言与表达方式，快速找到房子、工作、闲置物品与本地商家。
          </p>
        </section>

        <section id="about-sec-2" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">二、网站与产品特性</h2>
          <p>
            为便于您了解本站能力边界，现将当前产品与体验上的主要特性概括如下（具体功能以实际上线版本为准，并可能随迭代调整）：
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">五大分类 + 子类导航：</strong>
              覆盖「租房 / 找房 / 招聘 / 找工 / 二手闲置」五大分类，并细分到
              <em>整租、合租、单房、床位、车位、商铺办公、短租民宿</em>
              ；<em>餐饮、零售、美容美发、办公IT、医疗、教育、运输搬家、建筑装修</em>
              ；<em>手机数码、家具家电、服装箱包、母婴玩具、汽车配件、餐饮设备、乐器运动</em>
              等数十个子类。租房与找房、招聘与找工各自独立栏目，避免「房东帖」和「求租帖」混在一起。
            </li>
            <li>
              <strong className="text-foreground">四级地区筛选：</strong>
              支持全站、全州、城市、片区四级范围切换。您既能在同一个城市 / Metro 区域里精挑，也能一键扩大到全州或全美范围；站点记忆您近期选择的地区偏好。
            </li>
            <li>
              <strong className="text-foreground">AI 自然语言检索与对话助手：</strong>
              站内提供
              <Link href="/ai-search" className="text-primary hover:underline">
                AI 智能助手
              </Link>
              ，可用口语化自然语言描述需求（如「旧金山湾区 1500 以内的单间」「找一份餐饮工作」「三星 s23 便宜点的」），系统自动识别分类、子类、价位区间、品牌 / 型号等意图，并在检索不到时按「放宽价位 → 扩大地区 → 同子类泛化」顺序尝试，末端附带相关分类跳转按钮。
              <br />
              <strong className="text-foreground">AI 输出由算法自动生成</strong>
              ，可能存在不完整、不准确、过时或产生幻觉等情形，
              <strong className="text-foreground">不构成任何形式的建议</strong>
              （包括但不限于法律、税务、财务、投资、就业、租约、雇佣、医疗或移民建议），亦
              <strong className="text-foreground">不构成本平台对任何具体帖子、商家或交易对手方的推荐或担保</strong>
              。重要决策请您以帖子原文为准，并自行核实信息与风险，必要时咨询具备相应资质的专业人士。
            </li>
            <li>
              <strong className="text-foreground">商家黄页（入驻与认证）：</strong>
              本地商家可通过
              <Link href="/merchant/apply" className="text-primary hover:underline">
                商家入驻
              </Link>
              提交资质与营业执照，审核通过后出现在
              <Link href="/yellowpages" className="text-primary hover:underline">
                商家黄页
              </Link>
              ，按行业（餐饮、美容美发、家政保洁、搬家运输、房产中介、律师会计、汽车服务、教育培训、医疗保健、旅游机票、装修建材等）检索；认证商家在列表与详情页带有识别标识。入驻审核仅为基础合规检查，
              <strong className="text-foreground">不代表本平台对商家经营资质、服务质量或交易结果作出担保</strong>
              。
            </li>
            <li>
              <strong className="text-foreground">信用分与社区治理：</strong>
              每位用户有 0–100 的信用分（新注册为 100），违规发帖、被用户举报且经查实会扣分；信用分低于阈值会限制发帖，归零则账号及相关内容一并下架。详见
              <Link href="/credit" className="text-primary hover:underline">
                《信用分机制说明》
              </Link>
              。站内同时内置敏感词与高风险关键词提示、举报 / 拉黑 / 管理员审核等机制，降低欺诈、虚假与骚扰内容对用户的干扰。
            </li>
            <li>
              <strong className="text-foreground">账号与个人中心：</strong>
              支持邮箱 / 手机号注册登录、头像与资料管理，
              <Link href="/dashboard" className="text-primary hover:underline">
                仪表盘
              </Link>
              内按「在售 / 待审核 / 已售 / 过期 / 下架」分栏管理自己发布的帖子，可置顶、标记已售、删除；同时提供收藏、关注作者、新帖通知、浏览次数等常见互动能力。
            </li>
            <li>
              <strong className="text-foreground">每日发帖保护：</strong>
              为维持内容质量，单账号每天有发帖数量上限，并对高风险 / 敏感词帖子走先审后发；正常用户的发帖一般即时上线。
            </li>
            <li>
              <strong className="text-foreground">广告与赞助位展示：</strong>
              首页、分类列表、帖子详情及 AI 助手会话内设有多种广告位；AI 对话内的赞助卡会明确标注「赞助」并说明为商业展示位，与自然检索结果来源不同，并做跨大类兼容过滤（例如您在问车位租赁时，不会被强行插入无关二手帖）。
            </li>
            <li>
              <strong className="text-foreground">多设备与深色模式：</strong>
              响应式布局适配手机 / 平板 / 桌面，支持添加到主屏（PWA）与深色模式。
            </li>
          </ul>
        </section>

        <section id="about-sec-3" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">三、服务范围与限制</h2>
          <p>
            本平台仅提供信息存储、展示、检索及与之相关的账号管理、举报与风控等基础功能。我们
            <strong className="text-foreground">不对用户发布的信息的真实性、完整性、合法性、准确性、时效性</strong>
            作出任何明示或默示的保证与承诺。任何用户基于本平台信息所作出的决策、联络、交易或线下会面等行为，均由用户自行判断并承担全部风险与后果。
          </p>
          <p>
            <strong className="text-foreground">无事前审查义务：</strong>
            本平台作为信息发布与展示平台，
            <strong className="text-foreground">无义务</strong>
            对用户发布的所有内容进行事前审查或持续监控；站内的审核、风控、敏感词过滤与举报处理等机制，属于本平台自愿提供的运营措施，不应被理解为本平台对具体内容的保证或背书，亦不因此产生任何超出法定义务之外的注意义务或担保责任。
          </p>
          <p>
            <strong className="text-foreground">不保证持续可用：</strong>
            本平台不保证服务始终不中断、无错误、无延迟或无漏洞；因升级、迁移、系统故障、第三方服务异常、网络环境、不可抗力等原因造成的暂停、延迟、数据丢失或功能变更，本平台在合理范围内不承担责任，且可在必要时调整、限制、暂停或终止部分或全部功能。
          </p>
          <p>
            <strong className="text-foreground">责任上限：</strong>
            在适用法律允许的最大范围内，本平台及其关联方、雇员、顾问与合作方对任何
            <strong className="text-foreground">间接、附带、衍生、惩罚性、惩戒性或预期利益损失</strong>
            （包括但不限于利润损失、营业中断、商誉损失、数据丢失或无法使用）
            <strong className="text-foreground">概不承担责任</strong>
            ，无论该等责任系基于合同、侵权、严格责任或其他法理，亦不论本平台事前是否被告知此类损失的可能性。
          </p>
        </section>

        <section id="about-sec-4" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">四、用户责任与合规</h2>
          <p>
            用户在使用本平台时，应遵守美国及其他适用司法辖区的法律法规，不得发布违法、侵权、欺诈、歧视、骚扰、仇恨、色情、暴力、恐怖主义、枪支与管制药物、人口贩卖等内容。
            用户应自行确保其发布的内容不侵犯任何第三方的合法权益。因用户违反法律法规或本条款导致的任何索赔、处罚或损失，由用户自行承担。
          </p>
          <p>
            <strong className="text-foreground">配合调查与核验义务：</strong>
            用户应在合理范围内配合本平台进行的合规调查与内容核验，包括但不限于提供必要的身份说明、资质材料、交易凭证、沟通记录或其他辅助信息；如拒绝配合或提供虚假材料，本平台有权暂停或终止对该账号的服务，并保留向有权机关报告的权利。
          </p>
          <p>
            <strong className="text-foreground">合理使用举报机制：</strong>
            举报功能仅限于对明显违规、欺诈或违法内容的善意提示；
            <strong className="text-foreground">不得</strong>
            用于打击竞争对手、骚扰他人或规避平台规则。对恶意、重复或虚假举报，本平台有权不予处理并对相应账号采取相应措施。
          </p>
        </section>

        <section id="about-sec-5" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">五、知识产权与内容授权</h2>
          <p>
            用户在本平台发布的内容（文字、图片、联系方式等）之知识产权归用户或合法权利人所有。用户授予本平台在提供、改进、推广服务所必需的范围内，使用、存储、复制、展示与分发该内容 worldwide、非独占、可转授权的许可。
            若用户无权作出上述授权，请勿上传相关内容。
          </p>
          <p>
            <strong className="text-foreground">平台的内容管理权：</strong>
            在不降低用户法定权利的前提下，本平台有权基于
            <strong className="text-foreground">运营、安全、合规或用户体验</strong>
            等需要，在
            <strong className="text-foreground">不事先通知</strong>
            的情况下，对用户发布的内容进行修改提示、下架、隐藏、限制展示或删除，包括但不限于：疑似违法违规内容、被多次举报或存在较高风险的内容、明显与发布分类不符或重复灌水的内容、以及其他本平台认为不宜继续展示的内容。该等处置
            <strong className="text-foreground">不构成</strong>
            本平台对未被处置内容的认可或担保。
          </p>
        </section>

        <section id="about-sec-6" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">六、风险提示</h2>
          <p>
            分类信息平台普遍存在
            <strong className="text-foreground">虚假信息、钓鱼、诈骗、身份冒用、二次倒卖与线下纠纷</strong>
            等风险。请您在沟通、付款、签约或线下会面前：
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              自行核实对方身份、真实住址 / 经营地点、资质证照与联系方式；必要时要求视频看房、到店实地查看或见面当面交付。
            </li>
            <li>
              对「
              <strong className="text-foreground">提前转账 / 先付定金 / 代收代付 / 跳过平台私下汇款</strong>
              」「价格明显偏离市场」「催促立即付款 / 不愿见面核验」「要求发送银行账号 / 验证码 / 敏感个人信息」等情形保持高度警惕。
            </li>
            <li>
              对签订租约、雇佣、合伙、借款、投资、代办签证 / 身份 / 保险等涉及重大法律或财务后果的事项，建议咨询具备相应资质的专业人士。
            </li>
            <li>
              遇到可疑信息请及时使用站内
              <strong className="text-foreground">举报</strong>
              功能告知我们，并视情况向当地执法机关报案。
            </li>
          </ul>
          <p>
            本平台仅作为信息展示方，
            <strong className="text-foreground">不对用户因信任平台内容、用户或第三方而遭受的任何损失承担责任</strong>
            。
          </p>
        </section>

        <section id="about-sec-7" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">七、联系方式与运营主体</h2>
          <p>
            若您对本平台有任何疑问、投诉或合作意向，请通过以下方式与我们联系：
            <br />
            电子邮箱：{' '}
            <a href="mailto:admin@antiscamhelper.uk" className="text-primary hover:underline">
              admin@antiscamhelper.uk
            </a>
          </p>
          <p>
            <strong className="text-foreground">运营主体：</strong>
            本平台由「华人广场」运营团队维护；具体运营主体的公司名称、注册地、登记编号及法定代表人等详细信息，
            <strong className="text-foreground">将在接到执法、司法、行政监管机关或具备合法权利人身份的第三方依法请求时依法披露</strong>
            ；一般用户如需了解，可邮件联系上述邮箱说明来意，我们将酌情回复。
          </p>
          <p className="text-xs">
            我们将在合理期限内（通常不超过 15 个工作日）处理您的请求；涉及执法、法院或监管机关的合法请求，我们将依法配合并在法律允许的范围内保障用户合法权益。
          </p>
        </section>

        <section className="space-y-2 text-xs border-t pt-6">
          <p>
            本平台保留在必要时修订本页面的权利。若本页面与
            <Link href="/disclaimer" className="text-primary hover:underline">
              《免责声明》
            </Link>
            、
            <Link href="/privacy" className="text-primary hover:underline">
              《隐私声明》
            </Link>
            、
            <Link href="/credit" className="text-primary hover:underline">
              《信用分机制说明》
            </Link>
            或您与本平台之间的其他协议存在冲突，以具体条款中载明优先级或更新日期较新者为准。
          </p>
        </section>
      </article>
    </DocPageShell>
  )
}
