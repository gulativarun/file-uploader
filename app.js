const express =  require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


//Mongoose connectivity
const mongoose = require('./db/mongoose');

//Models
const {File} = require('./models/file');
const {User} = require('./models/user');

// authentication middleware
const {authenticate} = require('./middleware/authentication');

const port = process.env.PORT || 3000;
const app = express();
var httpServer = http.createServer(app);

app.use(bodyParser.urlencoded({
		extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/Public'));



// SET STORAGE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        let a = file.originalname.split('.')
        cb(null, `${file.fieldname}-${Date.now()}.${a[a.length-1]}`)
    }
})

const upload = multer({ storage: storage })


// FOR FOR SIGN UP
app.post('/signup',(req,res)=>{
	let user = new User({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	});

	user.save().then((userDetails)=>{
		return userDetails.generateAuthToken();
	}).then((token)=>{
		var data = {
			status : 200,
			token: token
		}
		res.send(data);
	}).catch((e)=>{
		var data = {
			status : 500,
			error : e
		}
		res.send(data);
	})
});


// FOR FOR USER LOGIN
app.post('/login', (req,res)=>{
	var body =  _.pick(req.body,['email', 'password']);
	User.findUserByCredentials(body.email, body.password).then((user)=>{
			return user.generateAuthToken().then((token)=>{
			var data = {
				status : 200,
				token: token
			}
			res.send(data);
		});
	}).catch((e)=>{
		var data = {
			status : 401,
		}
		res.send(data);
	});
});

// AUTHENTICATE EVERYTIME IF USER IS VALID OR NOT
app.get('/users/me', authenticate, (req,res)=>{
	res.send(req.user)
})


// UPLOADIND FILE
app.post('/uploadfile', authenticate, upload.single('file'), (req, res, next) => {
    const uploadedFile = req.file
    if (!uploadedFile) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    console.log(uploadedFile);

    let file = new File({
		name: uploadedFile.filename,
		_creator: req.user._id
	});

	file.save().then((file)=>{
		res.send(file);
	}, (e)=>{
		res.status(400).send(e)
	})
    // res.send(file)
})


// VIEW FILES
app.get('/files' , authenticate, (req,res)=>{
	File.find({_creator: req.user._id}).then((files)=>{
		var data = {
			status : 200,
			data: files
		}
		res.send(data);
	}).catch((e)=>{
		var data = {
			status : 404,
			error : e
		}
		res.send(data);
	});
});

// VIEW A SINGLE DOCUMENT
app.get('/file/:id', authenticate ,(req,res)=>{
	File.findById(req.params.id).then((file)=>{
		var data = {
			status : 200,
			data: file
		}
		res.send(data);
	}).catch((e)=>{
		var data = {
			status : 404,
			error : e
		}
		res.send(data);
	})
});

// DELETE A DOCUMENT
app.post('/delete' , authenticate, (req,res)=>{
	console.log(req.body.id);
	File.findOneAndDelete({_id: req.body.id}).then((file)=>{
		var data = {
			status : 200,
			data: file
		}
		res.send(data);
	}).catch((e)=>{
		var data = {
			status : 401,
			error: e
		}
		res.send(data);
	});
});




// define a route to download a file 
app.get('/download/:file(*)',(req, res) => {
  var file = req.params.file;
  var fileLocation = path.join('./uploads',file);
  console.log(fileLocation);
  res.download(fileLocation, file); 
});




httpServer.listen(port, ()=>{
	console.log(`Server is running on ${port}`);
});
