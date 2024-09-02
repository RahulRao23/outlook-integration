const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmailSchema = new mongoose.Schema(
	{
		id: { type: String },
		subject: { type: String },
		sender: { type: String },
		from: { type: String },
		receivedDateTime: { type: Date },
	},
	{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
	}
);

const EmailModel = mongoose.model('Email', EmailSchema);

module.exports = EmailModel;
