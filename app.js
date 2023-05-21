require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose= require("mongoose");
const app=express();
const maxL=100;
const composeSchema= new mongoose.Schema({
    title:String,
    post:String,
    completeText:String,
    urlName:String,
});
const composeModel= new mongoose.model("composes", composeSchema);
const _ =require("lodash");
const PORT= process.env.PORT || 3000;
async function main(){
    await mongoose.connect(process.env.MONGO);
}
main().catch(err=>console.log(err));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

app.get("/", async function(request, response){
const composes= await composeModel.find({});
response.render("home", {composesA: composes});
})
app.get("/contact", function(request, response){
response.render("contact-us");
})
app.get("/about", function(request, response){
response.render("about-us");
})
app.get("/publish", function(request, response){
response.render("publish");
})
app.post("/publish", async function(request, response){
const title=request.body.title;
const post=request.body.post;
const compose= new composeModel({
    title: title,
    post: post.substr(0,(maxL)),
    completeText: post, 
    urlName:_.lowerCase(title),
})
await compose.save();
response.redirect("/");
})
app.get("/posts/:title", async function(request, response){
    request.params.title=_.lowerCase(request.params.title);
    let x= _.lowerCase(request.params.title);
    const composes= await composeModel.find({});
composes.forEach(function(y){
 if(x===y.urlName){
   response.render("posts", {titleU:y.title, postU:y.completeText});
 }
})
})
app.listen(PORT, function(){
    console.log("The server is running on the port 3000");
})