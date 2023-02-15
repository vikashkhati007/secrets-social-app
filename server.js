//jshint esversion:6

const mongoose = require("mongoose");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config();
// app.use => express //

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "Hey My Secret is my Secret its not your",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//Mongoose Connection
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_DB);
const port = process.env.PORT || 3000;
//Login Database
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

UserSchema.plugin(passportLocalMongoose);

const Login = mongoose.model("login", UserSchema);
//

passport.use(Login.createStrategy());

passport.serializeUser(Login.serializeUser());
passport.deserializeUser(Login.deserializeUser());

//Content Database
const post = new mongoose.Schema({
  title: String,
  content: String,
  uploadTime: String,
});
const Post = mongoose.model("post", post);
//

app.get("/newuse", function (req, res) {
  const newusername = "admin";
  const newpassword = "champvko";
  Login.register({ username: newusername }, newpassword, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

const title = "Enter Login Details";
let inputwarning = "";

// --> Home Page <-- //
app.get("/", function (req, res) {
  Post.find({}, function (err, founditem) {
    if (err) {
      console.log(err);
    } else {
      res.render("home", { foundpost: founditem });
    }
  });
});



app.get("/login", function (req, res) {
  res.render("login" , {Title : title});
});

app.post("/login", function (req, res) {
  const user = new Login({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/adminhome");
      });
    }
  });
});

app.get("/adminhome", function(req,res){
  if (req.isAuthenticated()) {
    Post.find({}, function (err, founditem) {
      if (err) {
        console.log(err);
      } else {
        res.render("adminhome", { foundpost: founditem });
      }
    });
  } else {
    res.redirect("/");
  }
});

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose", { inputfields: inputwarning });
  } else {
    res.redirect("/");
  }
});

app.post("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    // Upload Timing

    const currenttime = {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "numeric",
      minute: "numeric",
    };
    const currentday = {
      weekday: "long",
    };

    const currentmonthyear = {
      month: "numeric",
      year: "numeric",
    };

    const date = new Date();
    const formattedDate = `${date.toLocaleTimeString("en-US", currenttime)}`;
    const formattedDate2 = `${date.toLocaleString("en-US", currentday)}`;
    const formattedDate3 = `${date.toLocaleString("en-US", currentmonthyear)}`;

    const indiadate =
      " Post Upload : " +
      formattedDate +
      "  " +
      formattedDate2 +
      " " +
      formattedDate3;
    //
    const usertitle = req.body.title;
    const usercontent = req.body.content;

    const newPost = new Post({
      title: usertitle,
      content: usercontent,
      uploadTime: indiadate,
    });

    if (usertitle === "" && usercontent === "") {
      res.render("compose", {
        inputfields: (inputwarning = "Warning, Your Both Field is Empty"),
      });
    } else if (usertitle === "") {
      res.render("compose", {
        inputfields: (inputwarning = "Warning, Your Title Field is Empty"),
      });
    } else if (usercontent === "") {
      res.render("compose", {
        inputfields: (inputwarning = "Warning, Content Field is Empty"),
      });
    } else if (usertitle.length > 70) {
      res.render("compose", {
        inputfields: (inputwarning =
          "Warning, Your Title is So Long , Try Again"),
      });
    } else {
      if (usercontent.indexOf(" ") === -1) {
        res.render("compose", {
          inputfields: (inputwarning = "Warning, Your content has no spaces"),
        });
      } else {
        newPost.save(function (err, founditems) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/adminhome");
          }
        });
        inputwarning = "";
      }
    }
  } else {
    res.redirect("/");
  }
});

app.listen(port, function (req, res) {
  console.log("Your Server Started in 3000");
});
