# RemotionUI marketing assets

## Brand images (committed)

| File | Size | Use |
|------|------|-----|
| `apps/web/public/logo.svg` | SVG | Nav, favicon fallback |
| `apps/web/public/icon-512.png` | ~4 KB | PWA / metadata |
| `apps/web/public/apple-icon.png` | ~2 KB | iOS home screen |
| `apps/web/public/og.png` | ~81 KB | Link previews (Twitter, Discord) |
| `apps/web/app/icon.svg` | SVG | Next.js favicon |
| `apps/web/app/opengraph-image.png` | auto | Next.js OG |
| `apps/web/app/twitter-image.png` | auto | Next.js Twitter card |

## Demo video (generate locally)

```bash
pnpm registry:build
pnpm --filter remotion-ui build
./scripts/render-marketing-demo.sh
# → marketing/social-clip-demo.mp4
```

Post copy: see `twitter-posts.md`

## Remotion resources PR

See `remotion-resources-pr.md`

## After deploy checklist

1. Paste `https://remotionui.com` in Twitter/Discord — confirm OG image shows Option A tagline
2. Publish Post 2 + 3 from `twitter-posts.md` with MP4 attached
3. Submit resources PR to remotion-dev/remotion
4. Verify Search Console + sitemap (manual, Google account)
