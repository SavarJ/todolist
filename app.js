const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const url = "mongodb://localhost:27017/todolistDB";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.error(err));

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
  new Item({
    name: "Type anything after / to create a custom list!",
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
        res.render("list", { title: day, items: items });
      }
    }
  });
});

app.post("/new-item", (req, res) => {
  const itemName = req.body.newItem.trim();
  const listName = req.body.list.trim();
  const item = new Item({
    name: itemName,
  });
  if (date.getDate() !== listName) {
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
  const title = req.body.list;
  if (date.getDate() !== title) {
    List.findOne({ name: title }, (err, foundList) => {
      if (err) {
        console.error(err);
      } else {
        let arr = foundList.items;
        arr = arr.filter((element) => element._id.toString() !== deleteId);
        foundList.items = arr;
        foundList.save((err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(
              "Successfully deleted and saved items from custom list"
            );
          }
          res.redirect("/" + title);
        });
      }
    });
  } else {
    Item.findByIdAndDelete(deleteId, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Successfully deleted the item from home list");
      }
      res.redirect("/");
    });
  }
});

function capitalize(str) {
  return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}

app.get("/:customListName", (req, res) => {
  const customListName = capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (err) {
      console.error(err);
    } else {
      if (foundList == undefined) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save((err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("Successfully saved the default items in the new list");
          }
          res.redirect("/" + customListName);
        });
      } else if (foundList.items.length === 0) {
        foundList.items = defaultItems;
        foundList.save((err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(
              "Successfully saved the default items because this custom list has no items"
            );
          }
          res.redirect("/" + customListName);
        });
      } else {
        res.render("list", {
          title: foundList.name,
          items: foundList.items,
        });
      }
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
