const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerConfig");
const Chat = require("../models/Chat");

// Image upload endpoint
router.post("/upload", upload.single("image"), async (req, res) => {
  const { userId, age } = req.body;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  let chat = await Chat.findOne({ userId });
  if (!chat) {
    chat = new Chat({ userId, age, messages: [] });
  }

  chat.messages.push({
    role: "user",
    text: "📷 Sent an image",
    image: imageUrl,
    time: new Date(),
  });
  chat.messages.push({
    role: "bot",
    text: "Image received. Thank you!",
    time: new Date(),
  });
  await chat.save();

  res.json({ reply: "Image received. Thank you!", imageUrl });
});

module.exports = router;
