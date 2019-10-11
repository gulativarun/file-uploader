const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

mongoose.set('useCreateIndex', true)


// USER SCHEMA
const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		min: 1
	},
	email: {
		type: String,
		required: true,
		trim: true,
		min: 1,
		unique : true, 
		validate: {
				validator: validator.isEmail, 
				message: '{value} is not a valid email'
		}
	},
	password : {
		type: String,
		required : true,
		minlength : 6 
	},
	tokens : [{
		access : {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
});

// THIS WILL ALWAYS RETURN EMAIL AND ID OF THE RECORD
UserSchema.methods.toJSON = function() {
	var user = this;
	var userObject = user.toObject();
	return _.pick(userObject,['email','_id']);
}

// CREATE ACCESS TOKEN
UserSchema.methods.generateAuthToken = function () {
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access}, 'abc123').toString();
	user.tokens.push({access,token});
	return user.save().then(()=>{
		return token
	});

};

// FIND OUT IF USER IS VALID OR NOT
UserSchema.statics.findUserByToken = function(token) {
  var user = this;
  var decocded;
  try{
  	decoded = jwt.verify(token,'abc123');
  } catch(e){
		return Promise.reject();
  }
  return user.findOne({ _id: decoded._id,
  	'tokens.token' : token,
  	'tokens.access' : 'auth'
   });
}


// MIDDLEWARE TO SAVE DECRYPTED PASSWORD
UserSchema.pre('save', function(next){
	var user = this;
	if(user.isModified('password')){

		bcrypt.genSalt(10, (err, salt) => {
		    bcrypt.hash(user.password, salt, (err, hash) => {
		        user.password = hash;
		        next();
		    });
		});
	}
	else{
		next()
	}

});


// FIND USER BY CREDENTIALS
UserSchema.statics.findUserByCredentials = function(email,password) {
  var User = this;

  return User.find({email: email}).then((user)=>{
  	if(!user){
  		return Promise.reject();
  	}
  	return new Promise((resolve,reject)=>{
  		bcrypt.compare(password,user[0].password,(err,res)=>{
  			console.log(res)
  			resolve(user[0]);
  		});
  	})
  });
  
}


const User = mongoose.model('User', UserSchema);

module.exports = {User}