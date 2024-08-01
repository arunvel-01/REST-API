const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { job } = require('./cron');

require("dotenv").config();

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
});

// Define the schema for articles
const articleSchema = {
  title: String,
  content: String,
};

// Create the Article model based on the schema
const Article = mongoose.model("Article", articleSchema);

// Set the default route to /articles
app.get("/", (req, res) => {
  res.redirect("/articles");
});

// Requests targetting all articles //
app.get("/articles", async function (req, res) {
  try {
    // Find all articles in the database
    const foundArticles = await Article.find();
    res.send(foundArticles);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/articles", async function (req, res) {
  try {
    // Create a new article based on the request body
    const newARTICLE = new Article({
      title: req.body.title,
      content: req.body.content,
    });
    // Save the new article to the database
    await newARTICLE.save();
    res.send("Successfully added a new article.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/articles", async function (req, res) {
  try {
    // Delete all articles from the database
    await Article.deleteMany({});
    res.send("Successfully deleted all articles.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Requests targetting specific article //
app.route("/articles/:articleTitle")
  .get(async function (req, res) {
    try {
      // Find an article by its title
      const foundArticle = await Article.findOne({
        title: req.params.articleTitle,
      });
      if (foundArticle) {
        res.send(foundArticle);
      } else {
        res.send("No articles matching that title were found.");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  })
  .put(async function (req, res) {
    try {
      // Update an article's title and content
      const updatedArticle = await Article.updateOne(
        { title: req.params.articleTitle },
        { title: req.body.title, content: req.body.content }
      );

      if (updatedArticle.Modified > 0) {
        res.send("No articles matching that title were found.");
      } else {
        res.send("Successfully updated article.");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  })
  .patch(async function (req, res) {
    try {
      // Update an article using $set to update only specified fields
      const updatedArticle = await Article.updateOne(
        { title: req.params.articleTitle },
        { $set: req.body }
      );

      if (updatedArticle.nModified > 0) {
        res.send("No articles matching that title were found.");
      } else {
        res.send("Successfully updated article.");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  })
  .delete(async function (req, res) {
    try {
      // Delete an article by its title
      const result = await Article.deleteOne({
        title: req.params.articleTitle,
      });
      if (result.deletedCount > 0) {
        res.send("Successfully deleted the corresponding article.");
      } else {
        res.send("No articles matching that title were found.");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

job.start();

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server is running on port ${port}.`);
});
