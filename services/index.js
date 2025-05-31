function setSecureCookie(res,token){
res.cookie("access_token",token,{
    httpOnly:false,
    secure:true,
    sameSite:"None",
    maxAge:60*1000
})
}

module.exports ={setSecureCookie}