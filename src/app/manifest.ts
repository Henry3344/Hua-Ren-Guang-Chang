import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '华人广场',
    short_name: '华人广场',
    description: '美国华人分类信息：租房、找房、招聘、找工、二手、商家黄页',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#171717',
    lang: 'zh-CN',
    icons: [
      {
        src: '/home-banner.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['business', 'lifestyle'],
    scope: '/',
  }
}
