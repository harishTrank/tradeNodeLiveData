const { Pool } = require("pg");
const axios = require("axios");

const host = "3.108.218.24";
const endPoints = `${host}:8000`;
const pool = new Pool({
  host,
  user: "postgres",
  password: "Test@123",
  database: "postgres",
  port: 5432,
});

const url = `http://${endPoints}/api/buy-sell-coin/`;

const pendingOrderManager = async (currentData) => {
  const client = await pool.connect();
  try {
    // LIMIT case -----------------
    const sqlQuery = `SELECT * FROM "App_buyandsellmodel" where is_pending=true AND LOWER(identifer)=LOWER('${currentData.InstrumentIdentifier}')`;
    const result = await client.query(sqlQuery);
    if (result.rows && result.rows.length > 0) {
      const successIds = result.rows
        .map((row) => {
          if (currentData) {
            if (
              (row.action === "BUY" && currentData.BuyPrice <= row.price) ||
              (row.action === "SELL" && currentData.SellPrice >= row.price)
            ) {
              return Number(row.id);
            }
          }
        })
        .filter((removeUndefined) => removeUndefined !== undefined);

      if (successIds && successIds.length > 0) {
        const updateQuery = `UPDATE "App_buyandsellmodel" SET is_pending = false WHERE id in (${successIds})`;
        await client.query(updateQuery);
      }
    }
    //  ----------------- ----------------- -----------------

    // SL CASE  ----------------- ----------------- ---------
    const selectSL = `SELECT * FROM "App_buyandsellmodel" where sl_flag = false AND LOWER(identifer)=LOWER('${currentData.InstrumentIdentifier}') AND LOWER(trade_type) = LOWER('SL') AND is_pending = false AND is_cancel = false`;
    const resultSL = await client.query(selectSL);
    if (resultSL.rows && resultSL.rows.length > 0) {
      resultSL.rows.map(async (mapItem) => {
        if (
          (mapItem.action.toUpperCase() === "BUY" &&
            mapItem.stop_loss >= currentData.BuyPrice) ||
          (mapItem.action.toUpperCase() === "SELL" &&
            mapItem.stop_loss <= currentData.SellPrice)
        ) {
          await axios.post(url, {
            userId: mapItem.buy_sell_user_id,
            identifer: currentData?.InstrumentIdentifier,
            trade_type: "SL",
            coin_name: mapItem.coin_name,
            ex_change: mapItem.ex_change,
            action: mapItem.action.toUpperCase() === "SELL" ? "BUY" : "SELL",
            quantity: mapItem.quantity,
            price:
              mapItem.action.toUpperCase() === "SELL"
                ? currentData.BuyPrice
                : currentData.SellPrice,
            is_pending: false,
            lot_size: currentData.QuotationLot,
            sl_flag: true,
            stop_loss: 0,
            is_cancel: false,
            type: "WEB",
          });
          await client.query(
            `UPDATE "App_buyandsellmodel" SET sl_flag = true WHERE id in (${mapItem.id})`
          );
        }
      });
    }
    //  ----------------- ----------------- -----------------
  } catch (err) {
    console.error("Error executing query:", err.message);
  } finally {
    client.release();
  }
};

module.exports = { pendingOrderManager, host, pool, url, endPoints };
