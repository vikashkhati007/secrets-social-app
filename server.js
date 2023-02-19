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
  role: String,
  username: String,
  password: String,
});

//Plugin
UserSchema.plugin(passportLocalMongoose);

const Login = mongoose.model("login", UserSchema);
// passport use
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

const confession = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: String,
  content: String,
  uploadTime: String,
});

const Confession = mongoose.model("confession", confession);


const MessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: String,
  content: String,
  status: String
});

const Message = mongoose.model("message", MessageSchema);

//

//New Account Creation

const title = "Enter Login Details";
let inputwarning = "";
const userRole = "user";
const adminRole = "heyyoudontknowthatonlyonekingisherenameisvk";

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
  res.render("login", { Title: title });
});

// Wokring on here i have add id admin login then admin page else user home;
app.post("/login", function (req, res) {
  const user = new Login({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err, user) {
    if (err) {
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        // Find the user document in the database based on the _id field
        Login.findOne({ username: req.body.username }, function (err, found) {
          if (found.role === userRole) {
            res.redirect("/userhome");
          } else if (found.role === adminRole) {
            res.redirect("/adminhome");
          } else {
            console.log(err);
          }
        });
      });
    }
  });
});

function isAdmin(req, res, next) {
  if (
    req.isAuthenticated() &&
    req.user.role === "heyyoudontknowthatonlyonekingisherenameisvk"
  ) {
    next();
  } else {
    res.redirect("/");
  }
}

// Route handler for the "/adminhome" route
app.get("/adminhome", isAdmin, function (req, res) {
  // Only users with the "admin" role can access this route
  Post.find({}, function (err, founditem) {
    if (err) {
      console.log(err);
    } else {
      Confession.countDocuments({}, (err, countfound) => {
        if (countfound) {
          res.render("admin/adminhome", {
            foundpost: founditem,
            count: countfound,
          });
        } else {
          res.render("admin/normaladminhome", { foundpost: founditem });
        }
      });
    }
  });
});

app.get("/createnewuser", function (req, res) {
  res.render("user/createnewacc", { Title: "Create A New Account" });
});

app.post("/createnewuser", function (req, res) {
  const newUser = new Login({
    role: userRole,
    username: req.body.username,
  });

  Login.register(newUser, req.body.password, function (err, user) {
    if (err) {
      res.render("user/createnewacc", { Title: "Username Already taken" });
    } else {
      passport.authenticate("local")(req, res, function () {
        const userID = user._id;
        const message = new Message({
          user: userID,
          title: "Welcome",
          content: `Thanks For Joining Us, Read More About us in (about/info) section`
        });
        
        message.save();
        res.redirect("/userhome");
      });
    }
  });
});

//

function isUser(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "user") {
    next();
  } else {
    res.redirect("/");
  }
}

app.get("/userhome", isUser, function (req, res) {
  if (req.isAuthenticated()) {
    Post.find({}, function (err, founditem) {
      if (err) {
        console.log(err);
      } else {
        const userId = req.user._id; // Get the user ID
        console.log(userId);
        Message.countDocuments({ user : userId }, function (err, message) {
          if (err) {
            // handle error
          } else {
            res.render("user/userhome", {
              foundpost: founditem,
              alert: "alertsuccess",
              message: "Sucessfully Logged-In - Submit Your Secrets Now",
              count : message
            });
          }
        });
  
      }
    });
  } else {
    res.redirect("/");
  }
});

app.get("/about", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("about");
  } else {
    res.redirect("/");
  }
});
//New Post By User
app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("admin/compose", { inputfields: inputwarning });
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
      res.render("admin/compose", {
        inputfields: (inputwarning = "Warning, Your Both Field is Empty"),
      });
    } else if (usertitle === "") {
      res.render("admin/compose", {
        inputfields: (inputwarning = "Warning, Your Title Field is Empty"),
      });
    } else if (usercontent === "") {
      res.render("admin/compose", {
        inputfields: (inputwarning = "Warning, Content Field is Empty"),
      });
    } else if (usertitle.length > 70) {
      res.render("admin/compose", {
        inputfields: (inputwarning =
          "Warning, Your Title is So Long , Try Again"),
      });
    } else {
      if (usercontent.indexOf(" ") === -1) {
        res.render("admin/compose", {
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

app.get("/confession", function (req, res) {
  if (req.isAuthenticated()) {
    const userId = req.user._id; // Get the user ID
    res.render("user/confession", { inputfields: inputwarning , userid : userId});
  } else {
    res.redirect("/");
  }
});

app.post("/confession", function (req, res) {
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
    const postid = req.body.id;

    const newPost = new Confession({
      user : postid,
      title: usertitle,
      content: usercontent,
      uploadTime: indiadate,
    });

    if (usertitle === "" && usercontent === "") {
      res.render("user/confession", {
        inputfields: (inputwarning = "Warning, Your Both Field is Empty"),
      });
    } else if (usertitle === "") {
      res.render("user/confession", {
        inputfields: (inputwarning = "Warning, Your Title Field is Empty"),
      });
    } else if (usercontent === "") {
      res.render("user/confession", {
        inputfields: (inputwarning = "Warning, Content Field is Empty"),
      });
    } else if (usertitle.length > 70) {
      res.render("user/confession", {
        inputfields: (inputwarning =
          "Warning, Your Title is So Long , Try Again"),
      });
    } else {
      if (usercontent.indexOf(" ") === -1) {
        res.render("user/confession", {
          inputfields: (inputwarning = "Warning, Your content has no spaces"),
        });
      } else {
        newPost.save(function (err, founditems) {
          if (err) {
            console.log(err);
          } else {
            const userId = req.user._id; // Get the user ID
            Post.find({}, function (err, foundpost) {
              Message.countDocuments({ user : userId }, function (err, count) {
                if (err) {
                  // handle error
                } else {
                  res.render("user/userhome", {
                    foundpost: foundpost,
                    alert: "alertupload",
                    message: "Post Uploaded, Wait for Admin Approval",
                    count: count
                  });
                }
              });
            
            });
          }
        });
        inputwarning = "";
      }
    }
  } else {
    res.redirect("/");
  }
});

app.get("/confessionrequest", function (req, res) {
  if (req.isAuthenticated()) {
    Confession.find({}, function (err, founditem) {
      if (err) {
        console.log(err);
      } else {
        res.render("admin/confessionrequest", { foundpost: founditem });
      }
    });
  } else {
    res.redirect("/adminhome");
  }
});

//Pending Work
app.post("/confessionrequest", (req, res) => {
  const accept = req.body.accept;
  const reject = req.body.reject;
  const itemid = mongoose.Types.ObjectId(req.body.id);
  const postid = mongoose.Types.ObjectId(req.body.userid);

  if (accept) {
    Confession.findById({ _id: itemid }, (err, item) => {
      if (err) {
        console.log(err);
      } else {
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
          const formattedDate = `${date.toLocaleTimeString(
            "en-US",
            currenttime
          )}`;
          const formattedDate2 = `${date.toLocaleString("en-US", currentday)}`;
          const formattedDate3 = `${date.toLocaleString(
            "en-US",
            currentmonthyear
          )}`;

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
            title: item.title,
            content: item.content,
            uploadTime: indiadate,
          });

          if (usertitle === "" && usercontent === "") {
            res.render("admin/compose", {
              inputfields: (inputwarning = "Warning, Your Both Field is Empty"),
            });
          } else if (usertitle === "") {
            res.render("admin/compose", {
              inputfields: (inputwarning =
                "Warning, Your Title Field is Empty"),
            });
          } else if (usercontent === "") {
            res.render("admin/compose", {
              inputfields: (inputwarning = "Warning, Content Field is Empty"),
            });
          } else if (usertitle.length > 70) {
            res.render("admin/compose", {
              inputfields: (inputwarning =
                "Warning, Your Title is So Long , Try Again"),
            });
          } else {
            if (usercontent.indexOf(" ") === -1) {
              res.render("admin/compose", {
                inputfields: (inputwarning =
                  "Warning, Your content has no spaces"),
              });
            } else {
              newPost.save(function (err, founditems) {
                if (err) {
                  console.log(err);
                } else {
                  //Deleting item after accept
                  Confession.deleteOne({ _id: itemid }, (err) => {
                    if (err) {
                      console.log(err);
                    } else {
                      if(req.body.reason === ""){
                        const aceeptmessage = new Message({
                          user: postid,
                          title: "Your Post Title : "+ founditems.title,
                          content: "Congratulation, Your Post is Approved By Admin , You can See Your Post In Homepage Now",
                          status : "Approved"
                        });
                        aceeptmessage.save();
                      }
                      else{
                        const aceeptmessage = new Message({
                          user: postid,
                          title: "Your Post Title : "+ founditems.title,
                          content: "Post Approved : " + req.body.reason,
                          status : "Approved"
                        });
                        aceeptmessage.save();
                      }
                    }
                  });
                  res.redirect("/adminhome");
                }
              });
              inputwarning = "";
            }
          }
        } else {
          res.redirect("/");
        }
      }
    });
  } else if (reject) {
    //Deleting item after accept
    Confession.findById({ _id: itemid }, (err, item) => {
      if(req.body.reason === ""){
        const aceeptmessage = new Message({
          user: postid,
          title: "Your Post Title :  "+ item.title,
          content: "Sorry, Your Post is Disapproved By Admin , You can Try Again",
          status : "Disapproved"
        });
        aceeptmessage.save();
      }
      else{
        const aceeptmessage = new Message({
          user: postid,
          title: "Your Post Title : "+ item.title,
          content: "Reason : " + req.body.reason,
          status : "Disapproved"
        });
        aceeptmessage.save();
      }
  
      Confession.deleteOne({ _id: itemid }, (err, found) => {
        if (err) {
          console.log(err);
        } else {
          
          res.redirect("/confessionrequest");
        }
      });
    });
  } else {
    console.log("confessionrequest post method not working");
  }
});

app.get("/normalhome", function (req, res) {
  if (req.isAuthenticated()) {
    const userId = req.user._id; // Get the user ID
  Post.find({}, function (err, founditem) {
    if (err) {
      console.log(err);
    } else {
      Message.countDocuments({ user : userId }, function (err, count) {
        if (err) {
          // handle error
        } else {
          res.render("user/normalhome", { foundpost: founditem , count : count});
        }
      });
    }
  });
} else {
  res.redirect("/");
}
});

app.get("/message", function(req,res){
  if (req.isAuthenticated()) {
    const userId = req.user._id; // Get the user ID
    Message.find({ user : userId }, function (err, founditem) {
      if (err) {
        // handle error
      } else {
        res.render("user/message", { foundpost: founditem});
      }
    });
  } else {
    res.redirect("/");
  }
});

app.post("/message", function(req,res){
  const Delete = req.body.delete;
  if (req.isAuthenticated()) {
    if (Delete) {
    const userId = mongoose.Types.ObjectId(req.body.postid); // Get the user ID
      //Deleting item after accept
      Message.deleteOne({_id: userId}, (err, found) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/message");
        }
      });
    } else {
      console.log("confessionrequest post method not working");
    }
  } else {
    res.redirect("/");
  }
 
})

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(port, function (req, res) {
  console.log("Your Server Started in 3000");
});
