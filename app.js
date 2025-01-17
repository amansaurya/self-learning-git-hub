if(process.env.NODE_ENV !="Production"){
    require('dotenv').config();
};


const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride= require("method-override");
const ejsMate=require("ejs-mate");
const expressError=require("./utils/expressError.js") //for synchronus error handling
const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash=require("connect-flash");
const passport= require("passport");
const LocalStrategy= require("passport-local");
const User=require("./models/user.js");

const listingRouter= require("./routes/listing.js");
const reviewRouter= require("./routes/review.js");
const userRouter= require("./routes/user.js")


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

//creating database
const dburl=process.env.ATLASDB_URL;
const secret=process.env.SECRET_SESSION;


main().then((res) => {
    console.log("connection successfull");
}).catch((err) => {
    console.log(err);
});
async function main() {
    //    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust") 
     await mongoose.connect(dburl); 
};


const store=  MongoStore.create({
    mongoUrl: dburl,
    crypto:{
   secret:secret,
    },
    touchAfter:24*3600,
    });

    store.on("error",()=> {
        console.log("error in mongo session store",err)
    })
 
const sessionOption ={
    store,
    secret:secret,
    resave:false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 *1000,
        maxAge:7 * 24 * 60 * 60 *1000,
        httpOnly:true,
    }
}

// app.get("/",(req,res) => {
//     res.send("i  am root");
// });




//session and flash message
app.use(session(sessionOption));
app.use(flash());

//authentcation

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());//information stored in session
passport.deserializeUser(User.deserializeUser());//rmove information from session

app.use((req,res,next) => {
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currentUser=req.user;
    next();
});

// app.get("/demo",async (req,res) => {
//    let fakeUser = new User({
//     email:"aman@gmail.com",
//     username:"aman09",
//   });
// let registerUser= await User.register(fakeUser,"aman");
// res.send(registerUser);
// })






// add some listing in database

// app.get("/listing",async (req,res) => {
//     let sampleListing= new Listing({
//         title:"My Fav House",
//         descripton:"By the marine drive",
//         price:19000,
//         loaction:"fatuha, Bihar",
//         country:"India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     console.log(sampleListing);
//     res.send("successful listing saved");
// });

// express route for listings router

app.use("/",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


//when routes is not found  which will be given byy user them error handle

app.all("*",(req,res,next) => {
    next(new expressError(404,"Page Not Found"));
})

// error handle middleware

app.use((err,req,res,next) => {
    let{status=500,message="something went wrong"}=err;
    res.status(status).render("error.ejs",{err})
    // res.status(status).send(message)
});

app.listen(8080,() => {
    console.log("server is listing at port 8080");
});

