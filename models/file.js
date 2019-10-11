const mongoose = require('mongoose');

// MODEL FOR SAVE INFORMATION OF FILE
const File = mongoose.model('File', { 
	name: { 
		type: String,
		required: true,
		trim: true
	},
	 date: {type: Date, 'default': Date.now, index: true}
	,
	_creator: {
		required: true,
		type: mongoose.Schema.Types.ObjectId
	}
});

module.exports = {File}