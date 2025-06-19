const cron = require("node-cron");
const ForexTrade = require("../models/ForexTrade");
const getExchangeRate = require("./forexApi");
const Wallet = require("../models/Wallet");

cron.schedule("*/10 * * * *", async () => {
  console.log("Checking stop-loss & take-profit orders...");
  const pendingTrades = await ForexTrade.find({ status: "pending" });

  for (let trade of pendingTrades) {
    const currentPrice = await getExchangeRate(trade.currencyPair);

    if (!currentPrice) continue;

    if (
      (trade.stopLoss && currentPrice <= trade.stopLoss) ||
      (trade.takeProfit && currentPrice >= trade.takeProfit)
    ) {
      // Auto-Sell
      const wallet = await Wallet.findOne({ user: trade.user });
      const currency = trade.currencyPair.split("/")[1];

      if (!wallet || wallet.forexBalance.get(currency) < trade.amount) continue;

      wallet.forexBalance.set(
        currency,
        wallet.forexBalance.get(currency) - trade.amount
      );
      wallet.balance += trade.amount * currentPrice;
      await wallet.save();

      trade.status = "completed";
      await trade.save();
      console.log(
        `Auto-sold ${trade.amount} of ${trade.currencyPair} for user ${trade.user}`
      );
    }
  }
});

module.exports = cron;
