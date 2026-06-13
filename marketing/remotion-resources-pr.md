# PR: Add RemotionUI to remotion.dev/docs/resources

Target repo: https://github.com/remotion-dev/remotion  
File: `packages/docs/docs/resources.mdx`  
Section: **Components** (same section as Onda — PR #7711)

## Line to add

```markdown
- [RemotionUI](https://remotionui.com) - Production-ready motion components for Remotion with CLI, docs previews, and AI agent indexes ([Source code](https://github.com/riaz37/remotion-ui), [NPM](https://www.npmjs.com/package/remotion-ui))
```

## PR title

```
Docs: Add RemotionUI to resources
```

## PR body

```markdown
## Summary

Adds RemotionUI to the resources page under Components.

RemotionUI is a registry-first component kit for Remotion — install primitives, scenes, and compositions as source with `npx remotion-ui add`. Includes live docs previews and AI-readable component/recipe indexes.

- Site: https://remotionui.com
- GitHub: https://github.com/riaz37/remotion-ui
- npm: https://www.npmjs.com/package/remotion-ui

## Test plan

- [ ] Link renders on resources page
- [ ] Links resolve correctly
```

## How to submit

```bash
gh repo fork remotion-dev/remotion --clone
cd remotion
git checkout -b docs/add-remotionui-resource
# edit packages/docs/docs/resources.mdx — add line under Components
git commit -am "Docs: Add RemotionUI to resources"
git push -u origin docs/add-remotionui-resource
gh pr create --repo remotion-dev/remotion --title "Docs: Add RemotionUI to resources" --body-file ../marketing/remotion-resources-pr-body.txt
```
