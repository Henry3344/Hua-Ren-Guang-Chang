import { getSiteUrl } from '@/lib/site'

/** 全站 WebSite + Organization 结构化数据，便于搜索与展示。 */
export default function JsonLdSite() {
  const url = getSiteUrl()
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: '华人广场',
        alternateName: 'Huaren Plaza',
        url,
        inLanguage: 'zh-CN',
        description: '华人社区分类信息平台：租房/找房、招聘/找工、二手与商家黄页',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${url}/posts?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: '华人广场',
        url,
        description: '华人社区分类信息平台：租房/找房、招聘/找工、二手与商家黄页',
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
