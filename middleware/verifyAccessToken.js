function verifyAccessToken(req,res,next){
    if(!req.cookies.access_token){
        return res.status(403).json({error:"Access Denied"})
    }
    console.log(req.cookies,"Cookie")
    next()
}

module.exports = {verifyAccessToken}


