require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const Book = require("./Book.js");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

const bcrypt = require("bcrypt");
const User = require("./User.js");
const jwt = require("jsonwebtoken");
const cors = require("cors");
app.use(cors());

const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.json({ error: "トークンがありません" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.json({ error: "無効なトークンです" });
  }
};

app.get("/books", auth, async (req, res) => {
  const books = await Book.find({ userId: req.userId });
  res.json(books);
});
app.get("/books/:id", auth, async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.json({ error: "本が見つかりません" });
  }
  res.json({
    message: `${book.title} は${book.author} によって書かれ、${book.year} に発売されました。`,
  });
});

app.post("/books", auth, async (req, res) => {
  const { title, author, year } = req.body;
  const book = new Book({ title, author, year, userId: req.userId });
  await book.save();
  res.json({ message: "本を追加しました", book });
});
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.json({ message: "登録完了" });
  } catch (error) {
    res.json({ error: "このメールアドレスは既に使われています。" });
  }
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ error: "ユーザーが見つかりません" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.json({ error: "パスワードが違います" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.json({ message: "ログイン成功", token });
});

app.put("/books/:id", auth, async (req, res) => {
  const { title, author, year } = req.body;
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { title, author, year },
    { new: true }
  );
  if (!book) {
    return res.json({ error: "本が見つかりません" });
  }
  res.json({ message: "変更しました", book });
});

app.delete("/books/:id", auth, async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    return res.json({ message: "本が見つかりません" });
  }
  res.json({ message: "削除しました" });
});

app.listen(3000, () => {
  console.log("http://localhost:3000/books");
});
