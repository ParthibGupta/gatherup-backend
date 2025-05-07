const AWS = require("aws-sdk");
require("dotenv").config();

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION, // AWS region
});

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