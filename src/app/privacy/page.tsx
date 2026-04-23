import Link from 'next/link'
import DocPageShell from '@/components/DocPageShell'
import type { DocTocItem } from '@/components/DocToc'

const TOC: DocTocItem[] = [
  { id: 'privacy-sec-1', label: '一、引言与适用范围' },
  { id: 'privacy-sec-2', label: '二、我们收集的信息' },
  { id: 'privacy-sec-3', label: '三、我们如何使用信息' },
  { id: 'privacy-sec-4', label: '四、Cookie 与类似技术' },
  { id: 'privacy-sec-5', label: '五、共享、委托处理与披露' },
  { id: 'privacy-sec-6', label: '六、不出售与定向广告' },
  { id: 'privacy-sec-7', label: '七、保留期限' },
  { id: 'privacy-sec-8', label: '八、安全措施' },
  { id: 'privacy-sec-9', label: '九、您的权利与选择' },
  { id: 'privacy-sec-10', label: '十、儿童隐私' },
  { id: 'privacy-sec-11', label: '十一、跨境传输' },
  { id: 'privacy-sec-12', label: '十二、自动化处理与 AI' },
  { id: 'privacy-sec-13', label: '十三、本声明的更新' },
  { id: 'privacy-sec-14', label: '十四、联系我们与运营主体' },
]

export default function PrivacyPage() {
  return (
    <DocPageShell toc={TOC}>
      <article className="prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground">
        <h1 className="text-2xl font-bold text-foreground mb-2">隐私声明</h1>
        <p className="text-xs text-muted-foreground mb-8">最后更新：2026年4月</p>

        <section id="privacy-sec-1" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">一、引言与适用范围</h2>
          <p>
            「华人广场」（以下简称「我们」「本平台」）重视您的隐私。本隐私声明说明我们在提供分类信息发布、检索、AI 对话助手、商家黄页与广告等服务时，如何收集、使用、存储、共享与保护您的个人信息，以及您所享有的权利与选择。
          </p>
          <p>
            本声明适用于您通过网页、移动端浏览器与 PWA 方式访问本平台，以及使用本平台账号登录的相关功能。使用本平台即表示您已阅读并理解本声明；若您不同意本声明或其中任一条款，请停止使用本平台，或请勿提供非必要的个人信息。本声明应与
            <Link href="/about" className="text-primary hover:underline">
              《关于我们》
            </Link>
            、
            <Link href="/disclaimer" className="text-primary hover:underline">
              《免责声明》
            </Link>
            与
            <Link href="/credit" className="text-primary hover:underline">
              《信用分机制说明》
            </Link>
            一并阅读。
          </p>
        </section>

        <section id="privacy-sec-2" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">二、我们收集的信息</h2>
          <p>
            <strong className="text-foreground">（1）账号与身份信息：</strong>
            您在注册 / 登录 / 找回密码 / 资料管理时提供的昵称、电子邮箱、手机号码、登录密码（经加密哈希后存储，本平台无法反查原始密码）、头像，以及商家入驻时提交的公司名称、行业、联系方式、地址、营业范围与营业执照 / 资质图像（仅在适用时收集）。
          </p>
          <p>
            <strong className="text-foreground">（2）您发布或上传的内容：</strong>
            帖子标题、描述、价格、分类 / 子类、图片、地理位置（由您填写的地区或帖子文本中出现的地址）、对外联系方式（如您在帖子中公开的电话、微信、邮箱等）、置顶 / 关注 / 收藏 / 举报 / 拉黑 / 删除等操作记录。
          </p>
          <p>
            <strong className="text-foreground">（3）交互与使用信息：</strong>
            您在站内的浏览记录、点击、搜索词、筛选条件、所选地区偏好、帖子浏览次数、停留时间、AI 助手对话记录（用于展示聊天历史、改进检索与回答质量），以及站内通知阅读状态等。
          </p>
          <p>
            <strong className="text-foreground">（4）技术与日志信息：</strong>
            IP 地址、用户代理（User-Agent）、设备与浏览器类型、操作系统、语言与时区、访问时间、访问路径（Referrer）、错误日志、性能指标、安全审计日志，以及反滥用 / 验证码服务（如 Cloudflare Turnstile）产生的相关数据。
          </p>
          <p>
            <strong className="text-foreground">（5）支付与交易信息：</strong>
            当您购买置顶 / 广告位等增值服务时，支付由第三方支付处理方（如 Stripe）完成。我们通常只能收到支付成功 / 失败状态、订单编号、金额、币种与最后四位卡号等有限信息；
            <strong className="text-foreground">完整的银行卡 / 银行账号等敏感金融信息由支付处理方直接收集与处理</strong>
            ，不经由本平台存储。
          </p>
          <p>
            <strong className="text-foreground">（6）广告与分析信息：</strong>
            广告位展示次数、点击次数、赞助帖的呈现与交互，以及汇总的流量与设备分布等统计信息。
          </p>
          <p>
            <strong className="text-foreground">（7）Cookie 与类似技术：</strong>
            详见下文「第四、Cookie 与类似技术」。
          </p>
          <p className="text-xs">
            我们
            <strong className="text-foreground">不会主动收集</strong>
            您的社会安全号（SSN）、完整驾照号、护照号、签证号、银行账户详细信息或其他高度敏感的政府身份证件信息；请您也
            <strong className="text-foreground">不要</strong>
            通过帖子正文、聊天对话或给其他用户的消息中主动发送此类敏感信息。
          </p>
        </section>

        <section id="privacy-sec-3" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">三、我们如何使用信息</h2>
          <p>
            在合法、正当、必要的前提下，我们将上述信息用于：
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>创建与维护您的账号、进行身份验证、管理会话与登录状态；</li>
            <li>展示、检索、筛选、排序与推荐站内帖子与商家，支持地区、分类、价位、关键词等筛选；</li>
            <li>
              提供 AI 自然语言助手功能，包括
              <em>意图识别、结构化抽取、多轨检索、相关性打分、结果改写、放宽召回与对话上下文理解</em>
              ；AI 对话记录可能被用于改进检索、排序与回答质量；
            </li>
            <li>发送与服务相关的重要通知（如发帖审核结果、举报处理、账号安全提醒、支付回执）；</li>
            <li>
              安全与风控：防止欺诈、虚假注册、爬取、刷量、滥用与恶意行为，配合
              <Link href="/credit" className="text-primary hover:underline">
                信用分
              </Link>
              机制、风险标记与举报处理；
            </li>
            <li>
              投放与衡量广告效果（站内第一方广告与赞助位的展示、点击与基础转化统计），用于改进版位策略；
              <strong className="text-foreground">
                我们不会基于您的敏感个人信息进行广告定向
              </strong>
              ；
            </li>
            <li>合规与法律义务：响应法院命令、传票、执法机关依法提出的调查，以及行政监管要求；</li>
            <li>
              改进产品与服务：错误诊断、A/B 测试、分类与子类词典的持续优化、AI
              检索策略的迭代调优；
            </li>
            <li>在您同意或法律允许的其他情形下开展的合理业务。</li>
          </ul>
          <p>
            <strong className="text-foreground">我们不会将您的个人信息出售给第三方</strong>
            ，也不会将其用于与上述目的不兼容的用途。我们可能委托第三方基础设施（如托管、数据库、CDN、对象存储、图像处理、邮件送达、验证码与支付处理服务）代为处理数据，该等处理方需受合同约束、履行保密与安全义务，并
            <strong className="text-foreground">仅能在提供服务所必需的范围内访问数据</strong>
            。
          </p>
        </section>

        <section id="privacy-sec-4" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">四、Cookie 与类似技术</h2>
          <p>我们与必要的服务商使用 Cookie、LocalStorage、SessionStorage 与类似技术，用于：</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">必要类（不可关闭）：</strong>
              维持您的登录会话、记忆安全凭据、防止跨站请求伪造（CSRF）、反滥用与验证码（如 Turnstile）；
            </li>
            <li>
              <strong className="text-foreground">偏好类：</strong>
              记住您选择的地区偏好、深色 / 浅色模式、语言等展示偏好，以提升体验；
            </li>
            <li>
              <strong className="text-foreground">分析类：</strong>
              以汇总、匿名或去标识化形式统计访问量、热门分类、功能使用情况，用于优化产品；
            </li>
            <li>
              <strong className="text-foreground">广告衡量类：</strong>
              记录站内第一方广告位与赞助卡的曝光 / 点击等基础数据。
            </li>
          </ul>
          <p>
            您可通过浏览器设置随时清除、禁用或限制 Cookie 与类似技术；但禁用必要类可能导致登录、发帖、支付等核心功能
            <strong className="text-foreground">无法正常使用</strong>
            。
          </p>
        </section>

        <section id="privacy-sec-5" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">五、共享、委托处理与披露</h2>
          <p>除以下情形外，我们不会向第三方共享您的个人信息：</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">经您明确同意：</strong>
              您主动选择共享，或在特定功能（如将帖子分享到社交平台、邀请好友）中授权的共享；
            </li>
            <li>
              <strong className="text-foreground">处理者 / 服务提供商：</strong>
              为实现本声明所述目的而委托的处理者，例如云托管、数据库、CDN、对象存储、图像处理、邮件送达、短信服务、反滥用与验证码服务、支付处理方等；该等处理者须受合同约束，仅在必要范围内处理数据并履行保密与安全义务；
            </li>
            <li>
              <strong className="text-foreground">帖子 / 资料公开展示：</strong>
              您主动发布在帖子、商家资料或公开个人主页中的信息，将按设计面向其他用户或公众展示，属于
              <strong className="text-foreground">您自行公开的行为</strong>
              ，不属于本平台向第三方的「共享」；
            </li>
            <li>
              <strong className="text-foreground">法律法规与合法请求：</strong>
              法律、法院命令、传票、执法机关或监管部门依法提出的调查或披露要求；
            </li>
            <li>
              <strong className="text-foreground">合法权益保护：</strong>
              为保护本平台、其他用户或公众的合法权益、生命财产安全、防止欺诈与严重违法行为所必需且合理的情形；
            </li>
            <li>
              <strong className="text-foreground">业务变更：</strong>
              若发生合并、收购、重组、资产转让或破产清算，您的信息可能作为相关资产的一部分被转移，但受让方应承担不低于本声明的保护义务，并在重大变更时在站内提示。
            </li>
          </ul>
        </section>

        <section id="privacy-sec-6" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">
            六、关于「不出售个人信息」与「定向广告」的说明
          </h2>
          <p>
            <strong className="text-foreground">我们不会出于金钱或其他对价而出售您的个人信息</strong>
            （包括在部分美国州法律项下的「出售 / 分享」含义）。站内广告、赞助位与置顶位目前均为
            <strong className="text-foreground">第一方投放</strong>
            ，以
            <strong className="text-foreground">分类上下文与地区偏好</strong>
            为匹配基础（如「租房分类页展示租房相关广告」），
            <strong className="text-foreground">不使用</strong>
            您的敏感个人信息或跨站行为画像作为广告定向依据。
          </p>
          <p>
            若未来我们计划引入基于跨站行为画像的定向广告或向第三方提供可识别个人信息的共享机制，我们将在实施前
            <strong className="text-foreground">显著更新本声明</strong>
            ，并在适用法律要求的情形下提供同意选项或退出（opt-out）机制。
          </p>
        </section>

        <section id="privacy-sec-7" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">七、保留期限</h2>
          <p>
            我们在实现收集目的所需的最短期限内保留信息，或在下列情形下保留较长期限：
            （i）法律法规、会计、税务或合同要求的保留期；
            （ii）争议解决、法律主张的主张或抗辩；
            （iii）安全审计、反欺诈与风控所必需的合理期限；
            （iv）备份与灾备系统的常规滚动覆盖。
          </p>
          <p>
            账号注销 / 删除请求通过验证后，我们会在合理期限内删除或匿名化相关信息，但
            <strong className="text-foreground">如下情形下的数据可能继续保留</strong>
            ：您发布的公开帖子下其他用户的互动记录 / 举报证据、已完成的支付与开票记录、安全事件相关日志、以及受上款（i）–（iv）约束的必要副本。
          </p>
        </section>

        <section id="privacy-sec-8" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">八、安全措施</h2>
          <p>
            我们采用行业通行的安全措施保护您的信息，例如：
            HTTPS / TLS 传输加密；密码仅以单向加盐哈希方式存储；基于角色与最小权限原则的访问控制；关键操作与安全事件的审计日志；对反滥用 / 验证码的使用与频率限制；对高风险内容的先审后发。
          </p>
          <p>
            然而，
            <strong className="text-foreground">互联网环境并非绝对安全</strong>
            ，我们无法保证信息在传输或存储过程中绝对不被未经授权的访问、披露、篡改或丢失。请您
            <strong className="text-foreground">妥善保管账号密码</strong>
            、启用独一无二的强密码、勿与他人共享账号；在公共设备使用后请主动退出登录，并警惕钓鱼邮件与仿冒站点。如您发现账号异常登录或安全漏洞，请立即通过下方联系方式与我们联系。
          </p>
        </section>

        <section id="privacy-sec-9" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">九、您的权利与选择</h2>
          <p>在适用法律允许的范围内，您可能就您的个人信息享有以下权利：</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">访问与副本：</strong>
              查阅我们持有的与您相关的主要个人信息；
            </li>
            <li>
              <strong className="text-foreground">更正：</strong>
              要求我们更正不准确或不完整的信息（许多字段可直接在个人资料、发帖编辑、商家资料处自助更新）；
            </li>
            <li>
              <strong className="text-foreground">删除 / 注销：</strong>
              要求删除您的账号与相应个人信息，受保留期限条款约束；
            </li>
            <li>
              <strong className="text-foreground">限制或反对：</strong>
              要求限制或反对某些处理，例如撤回先前授予的同意；
            </li>
            <li>
              <strong className="text-foreground">可携带性：</strong>
              在适用法律要求时，以结构化、通用格式获取您主动提供给我们的信息；
            </li>
            <li>
              <strong className="text-foreground">不受歧视：</strong>
              您行使上述权利时，我们不会因此对您进行歧视性差别对待或拒绝提供基本服务。
            </li>
          </ul>
          <p>
            请您通过下文「第十四、联系我们」中的邮箱提出请求。我们将在
            <strong className="text-foreground">验证您的身份</strong>
            （以防止冒名）后，在适用法律要求的合理期限内予以处理（通常不超过 30 个工作日，复杂情形下可依法延长并说明原因）；部分请求可能因法律例外（如出于合规、欺诈调查、其他用户权益保护等原因）而
            <strong className="text-foreground">无法全部满足或需延迟响应</strong>
            ，我们将向您说明理由。
          </p>
          <p className="text-xs">
            您有权在您所在地区的数据保护或消费者保护机关投诉；在此之前，我们鼓励您先与我们直接联系，以便尽快解决您的关切。
          </p>
        </section>

        <section id="privacy-sec-10" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十、儿童隐私</h2>
          <p>
            本平台面向一般公众使用，
            <strong className="text-foreground">不面向 13 岁以下儿童</strong>
            （或您所在司法辖区规定的更高年龄）设计，亦不会有意收集儿童的个人信息。若您是儿童的家长或监护人，认为我们可能无意中收集了儿童信息，请立即通过下方联系方式告知我们，我们将尽快采取合理措施删除相关信息。
          </p>
        </section>

        <section id="privacy-sec-11" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十一、跨境传输</h2>
          <p>
            本平台面向美国华人社区运营，您的信息可能被存储与处理于
            <strong className="text-foreground">美国或其他国家 / 地区</strong>
            （包括我们的云服务商与处理者所在地）；相关国家 / 地区的数据保护法律可能与您所在司法辖区存在差异。
          </p>
          <p>
            若您从美国境外访问并使用本平台，即表示您
            <strong className="text-foreground">理解并同意</strong>
            您的信息被传输、存储与处理于本平台运营所需的地点；在适用法律要求跨境传输需额外法律基础或同意的情形下，我们将采取合理措施满足该等要求。
          </p>
        </section>

        <section id="privacy-sec-12" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十二、自动化处理与 AI</h2>
          <p>
            本平台部分功能涉及自动化处理，例如：分类 / 子类推断、敏感词与高风险关键词识别、
            <Link href="/credit" className="text-primary hover:underline">
              信用分
            </Link>
            的扣分与恢复、AI 自然语言助手对您的查询进行意图识别与结果排序等。
          </p>
          <p>
            该等自动化处理的输出
            <strong className="text-foreground">可能存在偏差或错误</strong>
            ，并不作为对您任何法律权利、资格或授信的最终决定性依据。如您对某次自动化处理的结果（例如帖子被隐藏、信用分变动、AI 回答等）有异议，可通过下方联系方式请求
            <strong className="text-foreground">人工复核</strong>
            ，我们将在合理期限内处理。
          </p>
        </section>

        <section id="privacy-sec-13" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十三、本声明的更新</h2>
          <p>
            我们可能不时修订本声明，以反映产品迭代、法律法规更新或业务调整。
            <strong className="text-foreground">重大变更</strong>
            时，我们将在本平台显著位置提示或通过您预留的联系方式通知，并给予合理的生效缓冲期。您在修订后继续使用本平台即表示您接受修订后的声明；若您不接受修订，请停止使用本平台。
          </p>
        </section>

        <section id="privacy-sec-14" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十四、联系我们与运营主体</h2>
          <p>
            如对本隐私声明有任何疑问、投诉、请求或行使权利的需要，请发送邮件至：{' '}
            <a href="mailto:admin@antiscamhelper.uk" className="text-primary hover:underline">
              admin@antiscamhelper.uk
            </a>
            ，并在主题注明「隐私请求」以便优先处理。
          </p>
          <p>
            <strong className="text-foreground">运营主体：</strong>
            本平台由「华人广场」运营团队维护；具体运营主体的公司名称、注册地、登记编号及法定代表人等详细信息，
            <strong className="text-foreground">将在接到执法、司法、行政监管机关或具备合法权利人身份的第三方依法请求时依法披露</strong>
            ；一般用户如需了解，可邮件说明来意，我们将酌情回复。
          </p>
        </section>
      </article>
    </DocPageShell>
  )
}
