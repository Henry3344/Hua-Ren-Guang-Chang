import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // 头像、帖子图、广告、上传预览等 URL 来源不固定；用原生 <img> 避免长期维护 remotePatterns / fill / sizes
  {
    files: [
      "src/components/UserAvatar.tsx",
      "src/components/ImageUpload.tsx",
      "src/components/ImageLightbox.tsx",
      "src/components/AdSlot.tsx",
      "src/components/PostCard.tsx",
      "src/components/RelatedPosts.tsx",
      "src/app/**/PostDetailClient.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
