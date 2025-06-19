const axios = require("axios");
require("dotenv").config();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const getExchangeRate = async (currencyPair) => {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${
        currencyPair.split("/")[0]
      }&to_currency=${
        currencyPair.split("/")[1]
      }&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    return response.data["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
};

module.exports = getExchangeRate;
