const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const authenticateToken = require("../middleware/authMiddleware");
const upload = require("../middleware/multerConfig"); // multer config
const User = require("../models/User"); // Your user model
const path = require("path");
const cloudinary = require("../middleware/cloudinary"); // import your cloudinary config

// Predefined bot reply rules
const rules = {
  "cancel / modify order":
    "Cancel ya edit karne ke liye Order ID share karein.",
  "return / exchange request":
    "Return pickup ya replacement ke liye Order ID de.",
  "report failed transaction": "Agar paise kat gaye toh Order ID batayein.",
  "payment issues": "Refund delay ya double payment ka issue batayein.",
  "damage food": "Sorry for that! Please upload image of the damaged food.",
  "wrong food": "Please share photo of what you received.",
  "offers & discounts help":
    "Coupon ya gift card apply nahi ho raha? Details batayein.",
  "contact support": "Aap agent se baat kar sakte hain — type 'agent'.",
  other: "Please describe your issue in detail.",
};

router.post(
  "/chat",
  authenticateToken,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { message, step } = req.body;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const name = user.name;
      const email = user.email;
      const age = user.age;

      // Upload images to Cloudinary
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "chatbot",
          });
          imageUrls.push(result.secure_url);
        }
      }

      // Find existing chat or create new
      let chat = await Chat.findOne({ userId });
      if (!chat) {
        chat = new Chat({
          userId,
          name,
          email,
          age,
          messages: [],
        });
      } else {
        // Update name, email, age in case they changed
        chat.name = name;
        chat.email = email;
        chat.age = age;
      }

      // Save user message
      const userMessage = {
        role: "user",
        text: message || "",
        images: imageUrls.length > 0 ? imageUrls : [],
        time: new Date(),
      };
      chat.messages.push(userMessage);

      // Bot reply logic
      let reply, options, nextStep;
      if (!step) {
        reply = "How can I assist you?";
        options = Object.keys(rules);
        nextStep = "options";
      } else if (step === "options") {
        const msg = message.toLowerCase();
        if (msg.includes("cancel") || msg.includes("modify"))
          reply = rules["cancel / modify order"];
        else if (msg.includes("return") || msg.includes("exchange"))
          reply = rules["return / exchange request"];
        else if (
          msg.includes("failed transaction") ||
          msg.includes("transaction failed")
        )
          reply = rules["report failed transaction"];
        else if (msg.includes("payment")) reply = rules["payment issues"];
        else if (msg.includes("damage")) reply = rules["damage food"];
        else if (msg.includes("wrong food")) reply = rules["wrong food"];
        else if (
          msg.includes("coupon") ||
          msg.includes("discount") ||
          msg.includes("gift card")
        )
          reply = rules["offers & discounts help"];
        else if (msg.includes("agent") || msg.includes("support"))
          reply = rules["contact support"];
        else reply = rules["other"];
        nextStep = "details";
      } else if (step === "details") {
        reply = "Thank you, our support team will check and get back to you.";
        nextStep = "end";
      } else {
        reply = "Conversation ended.";
        nextStep = "end";
      }

      chat.messages.push({ role: "bot", text: reply, time: new Date() });
      await chat.save();

      res.json({ reply, options, step: nextStep });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get chat history for a specific user
router.get("/chat/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure requester is either the same user or an admin
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const chat = await Chat.findOne({ userId }).populate(
      "userId",
      "name age email"
    );

    if (!chat) {
      return res.json({ messages: [] }); // return empty if no chat exists
    }

    // Build full image URLs
    const messagesWithImageUrls = chat.messages.map((msg) => ({
      role: msg.role,
      text: msg.text || "", // default to empty string if text missing
      images: msg.images || [], // Ensure images is always an array
      time: msg.time,
    }));

    res.json({
      user: chat.userId,
      messages: messagesWithImageUrls,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    console.error("Get Chat API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
