const {User} = require('./../models/user');

// THIS MIDDLE WILL AUTHENTICATE USER EVERYTIME
let authenticate = (req,res,next) => {
	let token = req.header('x-auth');
	User.findUserByToken(token).then((user)=>{
		console.log(user);
		if(!user){
			return Promise.reject();
		}
		req.user = user;
		req.token = token;
		next();
	}).catch((e)=>{
			res.status(401).send(e);
	});
}


module.exports = {authenticate : authenticate}