const LocalStrategy=require("passport-local").Strategy
const bcrypt=require("bcrypt");

function initialize(passport){
    const authenticateUsers=async(name,password,done)=>{
        const user=getUserByname(name);
        if(user==null){
            return done(null, false,{message:"no user with that name"})
        }
        try{
            if(await bcrypt.compare(password, user.password)){
                return done(null,user);
            }
        }
        catch(e){
            console.log(e);
            return done(e);
        }
    }
    passport.use(new LocalStrategy({usernameField: 'name'}))
    passport.serializeUser((user,done) =>{})
    passport.deserializeUser((id,done) =>{})
}
module.exports-initialize