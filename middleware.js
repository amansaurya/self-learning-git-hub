const Listing=require("./models/listing.js");
const Review=require("./models/review.js");

const expressError=require("./utils/expressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
module.exports.isLoggedin= (req,res,next) => {
    // console.log(req.path,"..",req.originalUrl);
    if(!req.isAuthenticated()){
        //redirect Url
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","you must be logged in to create new listing");
      return  res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req,res,next) => {
if(req.session.redirectUrl){
    res.locals.redirectUrl=req.session.redirectUrl;
}
next();
}

module.exports.isOwner=async (req,res,next) => {
    let {id}=req.params;
    let listing= await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currentUser._id)){
   req.flash("error","you are not the owner of this listing");
   return  res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateListings= (req,res,next) => {
    let {error}= listingSchema.validate(req.body);
   
    if(error){
        let errorMsg =error.details.map((el) => el.message).join(",");
       throw new expressError(400,errorMsg)
    }else{
        next();
    }
};

module.exports.validateReviews= (req,res,next) => {
    let {error}= reviewSchema.validate(req.body);
   
    if(error){
        let errorMsg =error.details.map((el) => el.message).join(",");
       throw new expressError(400,errorMsg)
    }else{
        next();
    }
}

module.exports.isreviewAuthor=async (req,res,next) => {
    let {id,reviewsId}=req.params;
    let review= await Review.findById(reviewsId);
    if(!review.author.equals(res.locals.currentUser._id)){
   req.flash("error","You are not the author of this review");
   return  res.redirect(`/listings/${id}`);
    }
    next();
}