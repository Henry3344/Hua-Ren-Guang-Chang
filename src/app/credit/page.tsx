import DocPageShell from '@/components/DocPageShell'
import type { DocTocItem } from '@/components/DocToc'

const TOC: DocTocItem[] = [
  { id: 'credit-sec-1', label: '为什么要有信用分？' },
  { id: 'credit-sec-2', label: '满分是多少？默认多少？' },
  { id: 'credit-sec-3', label: '分数档位是什么意思？' },
  { id: 'credit-sec-4', label: '信用分什么时候会下降？' },
  { id: 'credit-sec-5', label: '降到 0 分会怎样？' },
  { id: 'credit-sec-6', label: '怎样保持高信用分？' },
]

export default function CreditPage() {
  return (
    <DocPageShell toc={TOC}>
      <article className="prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground">
        <h1 className="text-2xl font-bold text-foreground mb-2">信用分机制说明</h1>
        <p className="text-xs text-muted-foreground mb-8">最后更新：2026年4月</p>

        <section id="credit-sec-1" className="space-y-3 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">为什么要有信用分？</h2>
          <p>
            为维护社区健康与信息质量，「华人广场」引入信用分机制，用于减少违法、欺诈与高风险内容对用户的影响。
          </p>
          <p>
            该机制主要用于：<strong className="text-foreground">防违法</strong>、<strong className="text-foreground">防欺诈</strong>、<strong className="text-foreground">防犯罪</strong>、降低垃圾信息与恶意骚扰，提升整体信息质量与交易安全。
          </p>
        </section>

        <section id="credit-sec-2" className="space-y-3 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">满分是多少？默认多少？</h2>
          <p>
            信用分满分为 <strong className="text-foreground">100</strong>，新账号默认从 <strong className="text-foreground">100</strong> 开始。
          </p>
        </section>

        <section id="credit-sec-3" className="space-y-3 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">分数档位是什么意思？</h2>
          <p>资料页与帖文旁会同时显示分数与下列说明（颜色与分数一致）：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">81–100</strong>：正常用户
            </li>
            <li>
              <strong className="text-foreground">61–80</strong>：轻微风险
            </li>
            <li>
              <strong className="text-foreground">40–60</strong>：高风险
            </li>
            <li>
              <strong className="text-foreground">0–39</strong>：危险账号
            </li>
          </ul>
        </section>

        <section id="credit-sec-4" className="space-y-3 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">信用分什么时候会下降？</h2>
          <p>
            当用户或帖子被举报后，平台会进行审核。若举报属实，可能会对账号进行扣分处理；严重违规则可能直接封禁。
          </p>
          <p>
            为避免误伤，信用分并不会因为“有人点了举报”就立刻自动大幅下降；我们会结合举报信息与审核结果做处理。
          </p>
          <p>
            我们会<strong className="text-foreground">认真审核每一条举报与申诉</strong>，不会仅凭单次举报就随意封禁用户；处罚以事实与规则为依据，目的在保护大多数用户的安全与体验，也让你能安心使用。
          </p>
        </section>

        <section id="credit-sec-5" className="space-y-3 mb-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">降到 0 分会怎样？</h2>
          <p>
            当信用分降至 <strong className="text-foreground">0</strong> 时，账号会被封禁，同时该账号发布的帖子会被下架。
          </p>
        </section>

        <section id="credit-sec-6" className="space-y-3 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground">怎样保持高信用分？</h2>
          <p>
            请确保发布内容<strong className="text-foreground">真实、合规、与照片/描述尽量相符</strong>，并严格遵守发帖页的警告内容；谨防诈骗，不要发布违法或高风险信息。
          </p>
        </section>
      </article>
    </DocPageShell>
  )
}
