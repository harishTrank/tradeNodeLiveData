const { Schema, model } = require("mongoose");

const tradeCoinModal = new Schema({
  Exchange: {
    type: String,
    require: false,
  },
  InstrumentIdentifier: {
    type: String,
    require: true,
    unique: true,
  },
  LastTradeTime: {
    type: Number,
    require: false,
  },
  ServerTime: {
    type: Number,
    require: false,
  },
  AverageTradedPrice: {
    type: Number,
    require: false,
  },
  BuyPrice: {
    type: Number,
    require: false,
  },
  BuyQty: {
    type: Number,
    require: false,
  },
  Close: {
    type: Number,
    require: false,
  },
  High: {
    type: Number,
    require: false,
  },
  Low: {
    type: Number,
    require: false,
  },
  LastTradePrice: {
    type: Number,
    require: false,
  },
  LastTradeQty: {
    type: Number,
    require: false,
  },
  Open: {
    type: Number,
    require: false,
  },
  OpenInterest: {
    type: Number,
    require: false,
  },
  QuotationLot: {
    type: Number,
    require: false,
  },
  SellPrice: {
    type: Number,
    require: false,
  },
  SellQty: {
    type: Number,
    require: false,
  },
  TotalQtyTraded: {
    type: Number,
    require: false,
  },
  Value: {
    type: Number,
    require: false,
  },
  PreOpen: {
    type: Boolean,
    require: false,
  },
  PriceChange: {
    type: Number,
    require: false,
  },
  PriceChangePercentage: {
    type: Number,
    require: false,
  },
  OpenInterestChange: {
    type: Number,
    require: false,
  },
  MessageType: {
    type: String,
    require: false,
  },
  buyColor: {
    type: String,
    require: false,
  },
  sellColor: {
    type: String,
    require: false,
  },
});

module.exports = model("tradeCoinModal", tradeCoinModal, "tradeCoinModal");
