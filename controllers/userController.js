const AWS = require("aws-sdk");
require("dotenv").config();

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION, // AWS region
});

const AppDataSource = require("../config/database");
const { User } = require("../models/user");

const userRepository = AppDataSource.getRepository(User);

exports.getCurrentUser = async (req, res) => {
  try {
    const { sub } = req.user;

    if (!sub) {
      return res.status(400).json({ error: "User ID (sub) not found in request" });
    }

    const params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID, // Cognito User Pool ID
      Username: sub, // Cognito user ID
    };

    const data = await cognito.adminGetUser(params).promise();

    const userAttributes = data.UserAttributes.reduce((acc, attr) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {});

    res.status(200).json({
      user: {
        id: sub,
        name: userAttributes.name || "N/A",
        email: userAttributes.email || "N/A",
        phone: userAttributes.phone_number || "N/A",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user details", details: error.message });
  }
};

exports.addNewUser = async (req, res) => {
  try {

    const { sub, email, userName, fullName } = req.body;

    if (!sub || !email) {
      return res.status(400).json({ error: "Missing required user details" });
    }

    const existingUser = await userRepository.findOneBy({ userID: sub });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = userRepository.create({
      userID: sub,
      email,
      fullName, 
      userName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedUser = await userRepository.save(newUser);

    res.status(201).json({
      message: "User created successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      error: "Failed to create user",
      details: error.message,
    });
  }
};