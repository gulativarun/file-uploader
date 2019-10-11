const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost:27017/file-upload', {useNewUrlParser: true, useUnifiedTopology: true },()=>{
	console.log('DB CONNECTED');
});

module.exports = { mongoose };