const tradeCoinModal = require("../models/tradeCoin.model");
const axios = require("axios");
const { pool, url } = require("../Services/pendingOrderManager");
const dayjs = require("dayjs");

const expireCoinDelete = async (req, res) => {
  const client = await pool.connect();
  console.log("expireCoinDelete");
  try {
    const currentDate = dayjs().format("DDMMMYYYY").toUpperCase();
    const mongoQuery = {
      Exchange: { $ne: "NSE" },
      InstrumentIdentifier: { $regex: new RegExp(currentDate, "i") },
    };
    const sqlQuery = `SELECT 
                      identifer,
                      coin_name,
                      buy_sell_user_id,
                      SUM(quantity) AS total_quantity,
                      AVG(CASE WHEN quantity > 0 THEN price ELSE NULL END) AS avg_buy_price,
                      AVG(CASE WHEN quantity < 0 THEN price ELSE NULL END) AS avg_sell_price
                      FROM "App_buyandsellmodel"
                      WHERE trade_status = TRUE
                      AND is_pending = FALSE
                      AND is_cancel = FALSE
                      AND ex_change != 'NSE'
                      AND identifer LIKE '%${currentDate}%'
                      GROUP BY 
                  identifer, coin_name, buy_sell_user_id`;

    const queryResult = await client.query(sqlQuery);
    if (queryResult?.rows && queryResult.rows.length > 0) {
      queryResult.rows.map(async (position) => {
        const currentLiveData = await tradeCoinModal.findOne({
          InstrumentIdentifier: position.identifer,
        });
        await axios.post(url, {
          userId: position?.buy_sell_user_id,
          identifer: position?.identifer,
          trade_type: "Market",
          coin_name: position?.coin_name,
          ex_change: currentLiveData?.Exchange,
          action: Number(position?.total_quantity) < 0 ? "BUY" : "SELL",
          quantity: Math.abs(Number(position?.total_quantity)),
          price:
            Number(position?.total_quantity) > 0
              ? currentLiveData.SellPrice
              : currentLiveData.BuyPrice,
          is_pending: false,
          ip_address: "",
          order_method: "",
          lot_size: currentLiveData.QuotationLot,
          sl_flag: false,
          stop_loss: 0,
          is_cancel: false,
          type: "WEB",
        });
      });
    }
    await tradeCoinModal.deleteMany(mongoQuery);
    return res.status(200).json({
      status: true,
      message: "Content update successfully.",
    });
  } catch (e) {
    console.log("e", e);
    return res.status(404).json({
      status: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = expireCoinDelete;
