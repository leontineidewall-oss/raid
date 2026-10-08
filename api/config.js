// public settings the page needs: the $RAID mint and the hoard wallet (both set by the team in Vercel)
const { ADDR, send } = require("./_lib");
module.exports = function (req, res) {
  const mint = (process.env.RAID_MINT || "").trim();
  const vault = (process.env.HOARD_WALLET || "").trim();
  send(res, 200, {
    mint: ADDR.test(mint) ? mint : null,
    vault: ADDR.test(vault) ? vault : null,
    customRpc: !!process.env.RPC_URL
  }, "public, s-maxage=60");
};
