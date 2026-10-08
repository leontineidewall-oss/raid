# raid

Hold $50 of $RAID and you're a viking (beard, shield and codename come from your wallet address). 85% of creator fees fill the dragon's hoard. Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC) the crew raids it: odds are 20% + 1% per 10 buys - 1% per 10 sells in the last 6 hours, kept between 5% and 80%. Sells wake the dragon. A win splits the hoard equally across the crew; a loss rolls it into the next raid. Under $50 at raid time, you sit that one out.

## The site

- Live hoard balance and its latest transactions, read from chain.
- The odds, buys and sells from DexScreener; the dragon sleeps, stirs or wakes with them.
- The biggest crew members: top holders resolved to wallets, pools and the hoard left out, $50+ only.
- Check any wallet, or connect one (the address is only read; nothing is signed).
- Before launch every live number shows "—".

## Environment variables (Vercel)

| name | effect |
|---|---|
| RAID_MINT | The $RAID contract address. |
| HOARD_WALLET | The public hoard wallet that receives 85% of fees. |
| RPC_URL | Your own Solana RPC (e.g. Helius). The public endpoint rate-limits. |

## Files

- index.html: the page; the pixel engine is the same code as api/_raid.js.
- api/rpc.js: read-only JSON-RPC proxy. api/market.js: DexScreener price, buys and sells. api/config.js: public settings. api/og.js: the share image.
