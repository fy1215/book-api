require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const Book = require("./Book.js");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

app.get("/books", async (req, res) => {
  const books = await Book.find();
  res.json(books);
});
app.get("/books/:id", async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.json({ error: "本が見つかりません" });
  }
  res.json({
    message: `${book.title} は${book.author} によって書かれ、${book.year} に発売されました。`,
  });
});

app.post("/books", async (req, res) => {
  const { title, author, year } = req.body;
  const book = new Book({ title, author, year });
  await book.save();
  res.json({ message: "本を追加しました", book });
});

app.put("/books/:id", async (req, res) => {
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

app.delete("/books/:id", async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    return res.json({ message: "本が見つかりません" });
  }
  res.json({ message: "削除しました" });
});

app.listen(3000, () => {
  console.log("http://localhost:3000/books");
});
