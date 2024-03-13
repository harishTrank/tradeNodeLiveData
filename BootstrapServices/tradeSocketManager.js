const { tradeApiKey, webSocketURL } = require("../config/keys");
const tradeCoinModal = require("../models/tradeCoin.model");
const { pendingOrderManager } = require("../Services/pendingOrderManager");
const WebSocket = require("ws");
const nseList = require("../Extra/NSEList");
const { miniList } = require("../Extra/MiniList");

const staticCoins = {
  mcx: [
    "CRUDEOIL",
    "CRUDEOILM",
    "ALUMINI",
    "ALUMINIUM",
    "COPPER",
    "COPPERM",
    "GOLD",
    "GOLDM",
    "LEAD",
    "LEADMINI",
    "NATURALGAS",
    "NATGASMINI",
    "SILVER",
    "SILVERM",
    "SILVERMIC",
    "ZINC",
    "ZINCMINI",
  ],
};
const tradeSocketManager = () => {
  const ws = new WebSocket(webSocketURL);
  const authorization = {
    MessageType: "Authenticate",
    Password: tradeApiKey,
  };

  ws.on("open", () => {
    console.log("Connected to the WebSocket server");
    ws.send(JSON.stringify(authorization));
  });

  try {
    ws.on("message", async (data) => {
      const receivedData = JSON.parse(data);
      if (receivedData?.Complete) {
        staticCoins.mcx.map((item) => {
          ws.send(
            JSON.stringify({
              MessageType: "GetInstruments",
              Exchange: "MCX",
              InstrumentType: "FUTCOM",
              Product: item,
            })
          );
        });

        nseList.map((objIdentifier) => {
          ws.send(
            JSON.stringify({
              MessageType: "SubscribeRealtime",
              Exchange: "NSE",
              InstrumentIdentifier: objIdentifier,
            })
          );
        });
      }

      if (receivedData?.Result && receivedData?.Result.length > 0) {
        receivedData?.Result?.slice(0, 2)?.map((itemObj) => {
          itemObj &&
            ws.send(
              JSON.stringify({
                MessageType: "SubscribeRealtime",
                Exchange: "MCX",
                InstrumentIdentifier: itemObj.Identifier,
              })
            );
        });
      }
      if (receivedData?.MessageType === "RealtimeResult") {
        const currentObject = await tradeCoinModal.findOne({
          InstrumentIdentifier: receivedData?.InstrumentIdentifier,
        });
        if (receivedData?.BuyPrice > 0 && receivedData?.SellPrice > 0) {
          await tradeCoinModal.findOneAndUpdate(
            {
              InstrumentIdentifier: receivedData?.InstrumentIdentifier,
            },
            {
              ...receivedData,
              Exchange:
                receivedData.Exchange === "MCX" &&
                miniList?.find((item) =>
                  receivedData?.InstrumentIdentifier.match(item)
                )
                  ? "MINI"
                  : receivedData?.Exchange.toUpperCase(),
              QuotationLot:
                receivedData?.QuotationLot !== 0
                  ? receivedData?.QuotationLot
                  : 1,
              buyColor:
                currentObject?.BuyPrice < receivedData?.BuyPrice
                  ? "rgba(0, 255, 0, 0.4)"
                  : "rgba(256, 0,0, 0.4)",
              sellColor:
                currentObject?.SellPrice < receivedData?.SellPrice
                  ? "rgba(0, 255, 0, 0.4)"
                  : "rgba(256, 0,0, 0.4)",
            },
            {
              new: true,
              upsert: true,
            }
          );
          pendingOrderManager(receivedData);
        }
      }
    });
  } catch (error) {
    console.log("error In Socket case", error);
    // setTimeout(() => tradeSocketManager(), 1000);
    tradeSocketManager();
  }

  ws.on("close", () => {
    console.log("Connection closed");
    tradeSocketManager();
    // setTimeout(() => tradeSocketManager(), 1000);
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error: ${error.message}`);
    tradeSocketManager();
    // setTimeout(() => tradeSocketManager(), 1000);
  });
};

module.exports = tradeSocketManager;
