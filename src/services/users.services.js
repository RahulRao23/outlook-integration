const { UserModel } = require('../models/models');

async function getAllUsers() {
	const users = await UserModel.find();
	return users;
};

async function getAllUsersAsPOJO() {
	const users = await UserModel.find().lean();
	return users;
};

async function createUser(userData) {
	const newUser = new UserModel(userData);
	return await newUser.save();
};

module.exports = {
	getAllUsers,
	getAllUsersAsPOJO,
	createUser
};
