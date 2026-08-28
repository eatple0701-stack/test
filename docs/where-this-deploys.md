# Where this deploys

Two apps live side by side on this machine and they are not the same product.
Getting them confused took a live site down for a few hours on 2 August 2026,
so this file exists to make the boundary hard to miss.

| Folder | App | Repository | Production URL |
| --- | --- | --- | --- |
| `베이스/` | **밥친구 잇플 / Eatple** — this one | `github.com/eatple0701-stack/test`, branch `main` | https://eatple.vercel.app |
| `../k-food-map/` | **K-Food Map** — a different app | `github.com/rkdals0121/kfoodmap`, branch `master` | https://kfoodmap.vercel.app |

> **2026-08-22 — the repository moved to the team account.** 밥친구 was
> transferred from `rkdals0121/test` to `eatple0701-stack/test`. The old
> address still redirects, so an older clone keeps working, but the team
> address is the one to use. Everything below the "What happened" heading
> is the record of an August 2 incident and names the repositories as they
> were called *then* — it is history, and it is left as written.

밥친구 grew out of K-Food Map, so the two share early git history. That is why
the mistake was easy to make and why the histories look compatible: they are.
They are still two products with two audiences and two live URLs.

## Deploying 밥친구

On a fresh clone of `eatple0701-stack/test` this is simply:

```sh
git push            # main → Vercel builds
```

On 강민's original machine the same thing is spelled `git push` too, but only
because `origin` was removed and the local `master` tracks a remote named
`test` — a leftover of the incident below, not a pattern to copy.

`.githooks/pre-push` refuses any push to a repository that is not 밥친구's.
It allows both the team address and the old personal one (the redirect), and
still refuses `kfoodmap`, which is the whole reason it exists. The hook is
committed but `core.hooksPath` is local config, so **each clone has to turn it
on once**:

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
any case — all 87 were in `rkdals0121/test`, which was where 밥친구 deployed
from at the time, and travelled with it to the team account.
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
