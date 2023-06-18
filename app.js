require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose= require("mongoose");
const _ =require("lodash");
const passport= require("passport");
const session= require("express-session");
const argon2= require("argon2");
const Strategy= require("passport-local");

const app=express();

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,
}))
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static('./public'));

const userSchema= new mongoose.Schema({
    username: {type: String, unique:true},
    password: String,
})

const User= new mongoose.model("user", userSchema);

passport.use(new Strategy(
    async function(username, password, done) {
    try{
      const user= await User.findOne({ username: username }); 
      const IsValid= await argon2.verify(user.password, password);
      if(IsValid){
        done(null, user);
      } 
      else{
        done(null, null);
      }
    }
    catch(err){
        done(err,null);
    }
}));

passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

const maxL=100;
const composeSchema= new mongoose.Schema({
    title:String,
    post:String,
    completeText:String,
    urlName:String,
});
const composeModel= new mongoose.model("composes", composeSchema);


const PORT= process.env.PORT || 4000;

async function main(){
    try{
        const conn= await mongoose.connect(process.env.MONGO)
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch(error) {
        console.log(error);
        process.exit(1);
    }
}

/////////////////////////////////////////////////START PAGES/////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/", async function(request, response){
const composes= await composeModel.find({});
if(request.isAuthenticated()){
response.render("pages/home-editor", {composesA: composes});
}
else{
response.render("pages/home", {composesA: composes});
}
})

app.get("/contact", function(request, response){
response.render("pages/contact-us");
})

app.get("/about", function(request, response){
response.render("pages/about-us");
})

/////////////////////////////////////////////////END PAGES////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////START AUTHENTICATION/////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/JXfg4cTnhZdPRYqXuFrwvcJOUYzaoDkf", async function(request, response){
    if(request.isAuthenticated()){
        const composes= await composeModel.find({});
        response.render("posts/publish", {composesA: composes});
        }
    else{
        response.render("posts/login");
    }
})

app.post("/JXfg4cTnhZdPRYqXuFrwvcJOUYzaoDkf", passport.authenticate("local", {failureRedirect: '/', successRedirect: "/JXfg4cTnhZdPRYqXuFrwvcJOUYzaoDkf"}))

app.post("/logout", function(req, res, next){
    req.session.passport= null;
    req.session.save(function(err){
        if(err) next(err)
        req.session.regenerate(function(err){
            if(err) next(err)
            req.logOut(function(err){
                if(err){
                    console.log(err);
                }
                else{
                    res.redirect("/")
                }
            })
        })
    })
})

/////////////////////////////////////////////////END AUTHENTICATION/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////START COMPOSES ACTIONS/////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/publish", async function(request, response){
if(request.isAuthenticated()){
console.log(request.body);
const title=request.body.title;
const post=request.body.post;
const compose= new composeModel({
    title: title,
    post: post.substr(0,(maxL)),
    completeText: post, 
    urlName:_.lowerCase(title),
})
await compose.save();
response.redirect("/JXfg4cTnhZdPRYqXuFrwvcJOUYzaoDkf");
}
else{
response.redirect("/");
}
})

app.get("/edit/:composeId", async function(req, res){

if(req.isAuthenticated()){
 const composeId= req.params.composeId;
 const findCompose= await composeModel.findOne({_id: composeId});
 res.render("posts/edit", {composeA:findCompose});
}
else{
res.redirect("/");
}
})

app.post("/edit", async function(req, res){

if(req.isAuthenticated()){
 const {title, post, idEditCompose}= req.body;
 const findCompose= await composeModel.findOneAndUpdate({_id: idEditCompose}, {title: title, post: post.substr(0,(maxL)), completeText: post});
 if(findCompose){
    res.redirect("/");
 }
 else{
    res.send("ERROR!");
 }
}
else{
res.redirect("/");
}
})

app.post("/delete", async function(req, res){
    const composeId= req.body.idDeleteCompose;
    const deleteCompose= await composeModel.findOneAndDelete({_id:composeId});
    if(deleteCompose){
        res.redirect("/");
     }
     else{
        res.send("ERROR!");
     }
})

app.get("/posts/:title", async function(request, response){
    request.params.title=_.lowerCase(request.params.title);
    let x= _.lowerCase(request.params.title);
    const composes= await composeModel.find({});
composes.forEach(function(y){
 if(x===y.urlName){
   response.render("posts/posts", {titleU:y.title, postU:y.completeText});
 }
})
})

/////////////////////////////////////////////////END COMPOSES ACTIONS/////////////////////////////////////////////////////////////////////////////////////////////////

main().then(() => {
    app.listen(PORT, ()=>{
    console.log("The server is running");
})
})
