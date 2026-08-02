# Where this deploys

Two apps live side by side on this machine and they are not the same product.
Getting them confused took a live site down for a few hours on 2 August 2026,
so this file exists to make the boundary hard to miss.

| Folder | App | Repository | Production URL |
| --- | --- | --- | --- |
| `베이스/` | **밥친구 / Eatple** — this one | `github.com/rkdals0121/test`, branch `main` | https://test-umber-phi-78.vercel.app |
| `../k-food-map/` | **K-Food Map** — a different app | `github.com/rkdals0121/kfoodmap`, branch `master` | https://kfoodmap.vercel.app |

밥친구 grew out of K-Food Map, so the two share early git history. That is why
the mistake was easy to make and why the histories look compatible: they are.
They are still two products with two audiences and two live URLs.

## Deploying 밥친구

```sh
git push            # master → test/main → Vercel builds
```

`origin` has been removed from this clone and `master` tracks `test/main`, so a
bare push goes to the right place. `.githooks/pre-push` refuses any push to a
repository other than `rkdals0121/test`; enable it in a fresh clone with:

```sh
git config core.hooksPath .githooks
```

## What happened

Both folders had `origin` pointing at `rkdals0121/kfoodmap`. 밥친구 was merged
into that repository's `master` and pushed, and `kfoodmap.vercel.app` began
serving 밥친구. No commits were lost — K-Food Map's last state, `b160514`,
remained an ancestor throughout — but the other team's production URL was wrong
until an older deployment was promoted in Vercel.

The immediate cause was a push. The reason it was possible is that a folder for
one product had a remote for another, and nothing in the repository said so.
That is what this file and the hook are for.

## Still outstanding

`rkdals0121/kfoodmap`'s `master` still holds 밥친구's commits. The site is
correct because Vercel is serving a promoted earlier deployment, not because
the branch is. Two consequences for whoever works on K-Food Map next:

- a normal `git push` from `k-food-map/` will be rejected as non-fast-forward,
  because its local `master` (`b160514`) is behind the remote
- any push to that repository's `master` will redeploy 밥친구 over the site
  again

Fixing it needs one force push from the K-Food Map folder, by somebody who can
confirm no teammate has work on that branch:

```sh
cd ../k-food-map
git push --force origin master     # restores master to b160514
```

The state before that restore is kept on the remote as
`backup/master-before-restore-2026-08-02`, so the force push is reversible.
