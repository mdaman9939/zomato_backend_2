const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  userId: String,
  name: { type: String },
  email: { type: String },
  age: Number,
  messages: [
    {
      role: { type: String, required: true },
      text: { type: String, default: "" },
      images: { type: [String], default: [] },
      time: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", ChatSchema);
