# Where this deploys

Two apps live side by side on this machine and they are not the same product.
Getting them confused took a live site down for a few hours on 2 August 2026,
so this file exists to make the boundary hard to miss.

| Folder | App | Repository | Production URL |
| --- | --- | --- | --- |
| `베이스/` | **밥친구 잇플 / Eatple** — this one | `github.com/rkdals0121/test`, branch `main` | https://test-umber-phi-78.vercel.app |
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

## How it was put back

`rkdals0121/kfoodmap`'s `master` is restored at `dd0c7a4`, a commit whose tree
is byte-identical to `b160514`. So the site is now correct because the branch
is, not because Vercel is serving a promoted older build.

It was done as an ordinary commit rather than a force push. The 87 밥친구
commits in between stay reachable, so no existing clone breaks, nobody has to
reset, and `git pull` does the right thing. Those commits were never at risk in
any case — all 87 are in `rkdals0121/test`, which is where 밥친구 deploys from.
The pre-restore state is also kept at
`backup/master-before-restore-2026-08-02`.

Both directions are now blocked. This repository carries
`.githooks/pre-push`; the K-Food Map clone has the mirror image in its
`.git/hooks/pre-push`, refusing pushes to `rkdals0121/test`. That one is
deliberately uncommitted — it is a fact about how this machine is set up, not
about that project — so it needs re-creating after a fresh clone.

## Still outstanding

`rkdals0121/kfoodmap` still has a `phase0-domain-layer` branch that belongs to
밥친구. It does not affect production, which only ever builds `master`, but it
does produce preview deployments for the wrong app. Safe to delete whenever
somebody wants to: the same commits are in `rkdals0121/test`.
