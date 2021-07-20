const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
const url = "mongodb://localhost:27017/todolistDB";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
const List = mongoose.model("List", listSchema);

const defaultItems = [
  new Item({
    name: "Welcome to this todolist!",
  }),
  new Item({
    name: "Hit the + button to add a new item",
  }),
  new Item({
    name: "<-- Hit this to delete an item",
  }),
];

function simpleCallback(err, successMessage) {
  if (err) {
    console.log(err);
  } else {
    console.log(successMessage);
  }
}

app.get("/", (req, res) => {
  Item.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully queried DB for all items");
      if (items.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          simpleCallback(err, "Successfully added the default items to DB");
          res.redirect("/");
        });
      } else {
        const day = date.getDate();
        res.render("list", { title: day, items: items, isCustom: "false" });
      }
    }
  });
});

app.post("/new-item", (req, res) => {
  const itemName = req.body.newItem.trim();
  const listName = req.body.list.trim();
  const isCustom = req.body.hidden.trim();
  const item = new Item({
    name: itemName,
  });
  if (isCustom === "true") {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(item);
        foundList.save((err) => {
          simpleCallback(err, "Successfully saved new item");
        });
      }
      setTimeout(() => {
        res.redirect("/" + listName);
      }, 50);
    });
  } else {
    item.save((err) => {
      simpleCallback(err, "Successfully saved new item");
    });
    setTimeout(() => {
      res.redirect("/");
    }, 50);
  }
});

app.post("/delete-item", (req, res) => {
  const deleteId = req.body.checkbox.toString().trim();
  const isCustom = req.body.isCustom;
  const title = req.body.list;
  if (isCustom === "true") {
    List.findOne({ name: title }, (err, foundList) => {
      if (err) {
        console.log(err);
      } else {
      }
    });
  }
  Item.findByIdAndDelete(deleteId, (err) => {
    simpleCallback(err, "Successfully deleted the item");
  });
  setTimeout(() => {
    res.redirect("/");
  }, 50);
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName }, (err, foundList) => {
    if (err) {
      console.log(err);
    } else {
      if (foundList == undefined) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save({}, (err) => {
          simpleCallback(err, "Successfully saved item from customlist");
        });
        setTimeout(() => {
          res.redirect("/" + customListName);
        }, 50);
      } else {
        res.render("list", {
          title: foundList.name,
          items: foundList.items,
          isCustom: "true",
        });
      }
    }
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
