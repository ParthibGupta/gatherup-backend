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

exports.getUserProfile = async (req, res) => {
  try {
    const userID = req.user.sub;

    if (!userID) {
      return res.status(400).json({ error: "User ID (sub) not found in request" });
    }

    const user = await userRepository.findOneBy({ userID });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(201).json({
      status: "success",
      data: {
        id: user.userID,
        userName: user.userName,
        fullName: user.fullName,
        email: user.email,
        userDescription: user.userDescription,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({
      error: "Failed to retrieve user profile",
      details: error.message,
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  const userID = req.user.sub;
  const { userName, fullName, email, userDescription} = req.body;
  
  try {
    if (!userID) {
      return res.status(400).json({ error: "User ID (sub) not found in request" });
    }

    const updatedUser = await userRepository.update(userID, {
      userName,
      fullName,
      email,
      userDescription,
    });
    console.log("Updated User:", updatedUser);
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        id: updatedUser.userID,
        userName: updatedUser.userName,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        userDescription: updatedUser.userDescription,
        location: updatedUser.location,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      error: "Failed to update user profile",
      details: error.message,
    });
  }
};