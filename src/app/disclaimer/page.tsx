import Link from 'next/link'
import DocPageShell from '@/components/DocPageShell'
import type { DocTocItem } from '@/components/DocToc'

const TOC: DocTocItem[] = [
  { id: 'disclaimer-sec-1', label: '一、平台性质与信息来源' },
  { id: 'disclaimer-sec-2', label: '二、无担保与「按现状」提供' },
  { id: 'disclaimer-sec-3', label: '三、用户间交易、雇佣与线下风险' },
  { id: 'disclaimer-sec-4', label: '四、防诈骗与自我保护' },
  { id: 'disclaimer-sec-5', label: '五、AI 助手与算法功能' },
  { id: 'disclaimer-sec-6', label: '六、排序、推荐、置顶与广告位' },
  { id: 'disclaimer-sec-7', label: '七、第三方链接与集成' },
  { id: 'disclaimer-sec-8', label: '八、无事前审查义务与内容管理权' },
  { id: 'disclaimer-sec-9', label: '九、责任限制' },
  { id: 'disclaimer-sec-10', label: '十、赔偿' },
  { id: 'disclaimer-sec-11', label: '十一、法律适用与争议解决' },
  { id: 'disclaimer-sec-12', label: '十二、可分割性、不弃权与完整协议' },
  { id: 'disclaimer-sec-13', label: '十三、联系方式与运营主体' },
]

export default function DisclaimerPage() {
  return (
    <DocPageShell toc={TOC}>
      <article className="prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground">
        <h1 className="text-2xl font-bold text-foreground mb-2">免责声明</h1>
        <p className="text-xs text-muted-foreground mb-8">
          最后更新：2026年4月 · 适用美国法律原则
        </p>

        <section id="disclaimer-sec-1" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">一、平台性质与信息来源</h2>
          <p>
            「华人广场」（以下简称「本平台」）为
            <strong className="text-foreground">信息发布与展示平台</strong>
            。除本平台明确标注为「官方」「平台运营方」或「系统通知」发布的内容外，平台上全部信息（包括但不限于文字描述、价格、图片、联系方式、地理位置、商家认证状态与用户评分）均由用户自行创建、编辑与发布。
          </p>
          <p>
            本平台
            <strong className="text-foreground">并非</strong>
            信息发布者或发布者之代理人，亦
            <strong className="text-foreground">未对信息真实性、合法性、完整性、准确性或时效性进行实质性审查或担保</strong>
            ；亦
            <strong className="text-foreground">未对用户、商家、商品或服务提供任何形式的推荐、背书或保证</strong>
            。本平台
            <strong className="text-foreground">不参与、不介入、不监督、不担保</strong>
            用户之间的任何交易，并不承担交易各方的履约或违约责任。
          </p>
        </section>

        <section id="disclaimer-sec-2" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">二、无担保与「按现状」提供</h2>
          <p>
            本平台及所有服务在适用法律允许的最大范围内按
            <strong className="text-foreground">「现状」（AS-IS）与「可用」（AS AVAILABLE）</strong>
            基础提供。我们
            <strong className="text-foreground">排除</strong>
            对
            <em>适销性、特定用途适用性、不侵权、所有权、准确性、完整性、连续性、无错误、无病毒或符合您的预期</em>
            等任何形式的
            <strong className="text-foreground">明示或默示</strong>
            担保。
          </p>
          <p>
            您理解并同意：使用本平台及依赖本平台信息所可能产生的任何
            <strong className="text-foreground">直接、间接、附带、特殊、惩罚性、惩戒性、衍生或预期利益</strong>
            等损害（包括但不限于利润损失、营业中断、商誉损失、数据丢失或无法使用），
            <strong className="text-foreground">均由您自行承担</strong>
            ，无论此类损害系基于合同、侵权、严格责任或其他法理，亦无论本平台是否事先被告知此类损害的可能性。
          </p>
        </section>

        <section id="disclaimer-sec-3" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">三、用户间交易、雇佣与线下风险</h2>
          <p>
            用户之间的任何租赁、买卖、雇佣、服务、合作、借款、投资、合伙或资金往来，均属于
            <strong className="text-foreground">用户与用户之间的独立法律关系</strong>
            。本平台不介入、不参与、不监督、不担保任何交易或雇佣关系，也不对任何一方履行义务、信息真实性或交易结果承担责任。
          </p>
          <p>
            因看房、面试、试用、付款、定金、押金、租金、工资、税费、签证、保险、房屋状况、人身安全或财产损失、商品瑕疵、货物毁损或灭失、第三方付款工具风险等产生的争议，应由相关方
            <strong className="text-foreground">自行协商、调解、仲裁或诉讼解决</strong>
            ，与本平台无涉。
          </p>
        </section>

        <section id="disclaimer-sec-4" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">四、防诈骗与自我保护</h2>
          <p>本平台强烈建议您在沟通、签约或线下会面前做到：</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">优先核验身份与地点：</strong>
              自行核验对方真实身份、住址、经营地点、资质证照；必要时要求视频看房、到店实地查看或当面交付。
            </li>
            <li>
              <strong className="text-foreground">对下列情形保持高度警惕：</strong>
              要求预付大额押金、定金或「保证金」；使用
              <em>礼品卡、加密货币、电汇至第三方账户</em>
              付款；「先付款后看货 / 看房」；价格明显偏离市场价；催促立即付款、不愿见面核验；要求发送
              <em>银行账号、验证码、SSN、护照 / 签证原件、I-20、EAD、身份证件图像</em>
              等敏感信息。
            </li>
            <li>
              <strong className="text-foreground">大额与长期合同请咨询专业人士：</strong>
              涉及租约、雇佣、合伙、借款、投资、代办签证 / 身份 / 保险、跨境汇款等具有重大法律或财务后果的事项，建议咨询具备相应资质的独立律师、注册会计师或持牌顾问。
            </li>
            <li>
              <strong className="text-foreground">遭遇诈骗时立即报案：</strong>
              若您遭遇或怀疑诈骗，请立即联系当地执法机构（在美国如情况紧急请拨打 911，或联系当地非紧急报警电话、FBI IC3 等报案渠道），并通过本平台
              <strong className="text-foreground">举报</strong>
              功能向我们反馈。
            </li>
          </ul>
          <p>
            本平台就风险提示与反诈指引所作的任何说明，
            <strong className="text-foreground">仅为善意提醒</strong>
            ，不构成法律意见，也不代表本平台对任何交易的担保或对任何特定对象的指控。
          </p>
        </section>

        <section id="disclaimer-sec-5" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">五、AI 助手与算法功能</h2>
          <p>
            站内提供的
            <Link href="/ai-search" className="text-primary hover:underline">
              AI 自然语言助手
            </Link>
            及相关智能检索、自动改写、意图识别、类目推断、推荐排序等功能，均为
            <strong className="text-foreground">算法自动生成</strong>
            ，依赖模型能力与站内数据质量。该等 AI 输出
            <strong className="text-foreground">可能存在不完整、不准确、过时、误解或产生幻觉</strong>
            等情形。
          </p>
          <p>
            AI 输出
            <strong className="text-foreground">不构成任何形式的建议</strong>
            ，包括但不限于
            <em>法律、税务、财务、投资、就业、租约、雇佣、医疗、保险、移民或签证建议</em>
            ；亦
            <strong className="text-foreground">不构成本平台对任何具体帖子、商家、品牌、价格或交易对手方的推荐、担保或事实陈述</strong>
            。请您以帖子原文及您与对方的直接沟通为准，必要时咨询具备相应资质的专业人士。
          </p>
        </section>

        <section id="disclaimer-sec-6" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">六、排序、推荐、置顶与广告位</h2>
          <p>
            本平台对帖子与商家所作的
            <strong className="text-foreground">展示、排序、置顶、推荐、AI 相关性打分、分类筛选与广告 / 赞助位投放</strong>
            ，均为平台运营层面的产品功能，用于优化信息分发与用户体验，
            <strong className="text-foreground">不应被理解为</strong>
            本平台对相应内容真实性、合法性或质量的背书、担保或推荐。
          </p>
          <p>
            站内赞助位、置顶位与 AI 助手内的赞助单卡均会按规定标注「赞助 / 推广」等字样；其出现
            <strong className="text-foreground">不代表</strong>
            该内容在相关性、价格或信誉方面优于其他内容。广告主所宣称之商品或服务之真实性、合法性、资质与履约能力，
            <strong className="text-foreground">由广告主自行负责</strong>
            。
          </p>
        </section>

        <section id="disclaimer-sec-7" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">七、第三方链接与集成</h2>
          <p>
            本平台可能包含或集成指向第三方网站、支付、云存储、图像处理、消息推送、反滥用验证、地图或其他服务的链接与接口（包括但不限于托管服务提供商、CDN、对象存储、支付处理方如 Stripe、验证码服务如 Cloudflare Turnstile、邮件送达服务等）。该等第三方服务受其各自条款与隐私政策约束，本平台
            <strong className="text-foreground">不对其内容、可用性、安全性、收费或服务质量负责</strong>
            。
          </p>
        </section>

        <section id="disclaimer-sec-8" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">八、无事前审查义务与内容管理权</h2>
          <p>
            本平台
            <strong className="text-foreground">无义务</strong>
            对所有用户发布内容进行事前审查或持续监控；站内的敏感词过滤、举报处理、风控与审核等机制属于本平台
            <strong className="text-foreground">自愿提供</strong>
            的运营措施，
            <strong className="text-foreground">不应被理解为</strong>
            本平台对具体内容的保证或背书，亦不因此产生任何超出法定义务之外的注意义务或担保责任。
          </p>
          <p>
            本平台有权基于法律法规、本声明、
            <Link href="/about" className="text-primary hover:underline">
              《关于我们》
            </Link>
            、
            <Link href="/credit" className="text-primary hover:underline">
              《信用分机制说明》
            </Link>
            、社区规则或监管要求，对涉嫌违法、侵权、欺诈、重复、垃圾、高风险或明显与发布分类不符的内容，以及与本平台运营、用户体验或第三方合法权益不相容的内容，采取
            <strong className="text-foreground">删除、屏蔽、降权、隐藏、限制展示、要求修改、要求补充资质或终止账号</strong>
            等措施，且在合理必要时
            <strong className="text-foreground">无须事先通知</strong>
            （但在可行时将尽力通知）。
          </p>
          <p>
            用户
            <strong className="text-foreground">不得</strong>
            因该等措施向本平台主张所谓「预期利益」「机会损失」或类似权利。该等处置
            <strong className="text-foreground">不构成</strong>
            本平台对未被处置内容的认可或担保。
          </p>
        </section>

        <section id="disclaimer-sec-9" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">九、责任限制</h2>
          <p>
            在适用法律允许的最大范围内，本平台及其运营方、关联公司、管理人员、员工、顾问与合作伙伴
            <strong className="text-foreground">对您或任何第三方因使用、无法使用或依赖本平台信息而产生的一切索赔所承担的总额责任</strong>
            ，应
            <strong className="text-foreground">不超过您在过去十二个月内就本平台向我们所支付的费用总额</strong>
            ；若您未支付任何费用，则该责任限额为零或适用法律允许的最低额，以较高者为准。
          </p>
          <p className="text-xs">
            部分司法辖区不允许限制或排除某些默示担保或某些种类的损害（例如消费者保护法项下的特定权利），故上述限制可能对您不适用；在此情形下，本平台的责任应限制在适用法律所允许的最小范围内。
          </p>
        </section>

        <section id="disclaimer-sec-10" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十、赔偿</h2>
          <p>
            在适用法律允许的最大范围内，您同意
            <strong className="text-foreground">赔偿并使本平台及其运营方、关联公司、管理人员、员工与合作伙伴免受</strong>
            因下列情形引起或与之相关的任何索赔、损失、责任、损害、罚款、费用与开支（包括合理的律师费）：（i）您违反本声明、其他平台规则或适用法律；（ii）您发布、上传、传输或提供的内容；（iii）您与其他用户或第三方之间的交易或争议；（iv）您对本平台的任何滥用行为。
          </p>
        </section>

        <section id="disclaimer-sec-11" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十一、法律适用与争议解决</h2>
          <p>
            本免责声明的解释与执行，在不违反强制性法律与消费者保护法的前提下，应适用
            <strong className="text-foreground">美国联邦法律及本平台运营地所在州的法律</strong>
            ，并排除其冲突法规则。若您对本平台有任何争议，应首先通过下方联系方式与我们
            <strong className="text-foreground">友好协商</strong>
            ；协商不成的，可依法向具有管辖权的法院提起诉讼。
          </p>
          <p className="text-xs">
            您与本平台之间的任何主张或诉因，均应在该主张或诉因产生之日起
            <strong className="text-foreground">一年内</strong>
            提起，否则该主张或诉因将永久失效（适用法律另有强制性规定者除外）。
          </p>
        </section>

        <section id="disclaimer-sec-12" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十二、可分割性、不弃权与完整协议</h2>
          <p>
            本声明任一条款若被有权机关裁定为无效或不可执行，不影响其他条款的有效性；其他条款仍应按原意旨继续有效执行，并在必要时由最接近原意且可执行的条款替代。
          </p>
          <p>
            本平台未立即行使本声明项下之任何权利，不构成对该权利的弃权；亦不影响本平台未来行使该等权利。
          </p>
          <p>
            本声明连同
            <Link href="/about" className="text-primary hover:underline">
              《关于我们》
            </Link>
            、
            <Link href="/privacy" className="text-primary hover:underline">
              《隐私声明》
            </Link>
            、
            <Link href="/credit" className="text-primary hover:underline">
              《信用分机制说明》
            </Link>
            及其他站内专项规则，构成您与本平台之间就使用本平台所达成的
            <strong className="text-foreground">完整协议</strong>
            。
          </p>
        </section>

        <section id="disclaimer-sec-13" className="space-y-4 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">十三、联系方式与运营主体</h2>
          <p>
            如您对本免责声明有任何疑问、投诉或通知，请发送邮件至：{' '}
            <a
              href="mailto:admin@antiscamhelper.uk"
              className="text-primary hover:underline"
            >
              admin@antiscamhelper.uk
            </a>
            。
          </p>
          <p>
            <strong className="text-foreground">运营主体：</strong>
            本平台由「华人广场」运营团队维护；具体运营主体的公司名称、注册地、登记编号及法定代表人等详细信息，
            <strong className="text-foreground">将在接到执法、司法、行政监管机关或具备合法权利人身份的第三方依法请求时依法披露</strong>
            ；一般用户如需了解，可邮件说明来意，我们将酌情回复。
          </p>
        </section>

        <p className="text-xs border-t pt-6">
          <strong className="text-foreground">重要提示：</strong>
          阅读并继续使用本平台，即表示您已阅读、理解并同意受本免责声明约束。若您不同意本声明的任一条款，请立即停止使用本平台。本声明的更新以本页
          <em>「最后更新」</em>
          日期为准；重大更新时我们会在站内显著位置提示。
        </p>
      </article>
    </DocPageShell>
  )
}
