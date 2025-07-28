const JWT = require('jsonwebtoken')

module.exports = async(req,res,next) => {
    try {
        const authHeader = req.headers['authorization'];

        // ✅ Fix: Check if authHeader is undefined
        if (!authHeader) {
            return res.status(401).send({
                success: false,
                message: 'Auth Failed: No Token Provided'
            });
        }

        const token = authHeader.split(" ")[1]; // Extract the token
        JWT.verify(token,process.env.JWT_SECRET, (err,decode) => {
            if(err){
                return res.status(401).send({
                    success:false,
                    message:'Auth Failed'
                })
            }else{
                req.body.userId = decode.userId;
                next();
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(401).send({
            success:false,
            error,
            message:'Auth Failed'
        })
    }
}