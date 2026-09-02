# The app's own name inside English strings

Decided 2026-09-02: inside an English sentence the app is **Eatple**; inside a Korean sentence it is **밥친구**. Hangul in the middle of a Latin sentence is unreadable to most travellers.

Every English-arm `say()` string that still says 밥친구 or 잇플, found mechanically by `scripts/list-app-name-in-english.mjs`. **Nothing here was changed**: the consent text was the only line in scope, and landing many sites at once is what took production down on 2026-09-01. Fix these in a batch of their own, and re-run the script to confirm the list is empty afterwards.

Strings written as a "한국어 · English" pair are excluded — there the Hangul is the Korean half and LocaleFilter splits it.

| file:line | English string |
|---|---|

Total: 0
