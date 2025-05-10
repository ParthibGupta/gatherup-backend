const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem"); // Convert JWK to PEM
require("dotenv").config();

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION, 
});

// Middleware to verify AWS Cognito JWT token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; 
    
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decodedToken = jwt.decode(token, { complete: true });

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const jwksUrl = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

    fetch(jwksUrl)
      .then((response) => response.json())
      .then((jwks) => {
        const signingKey = jwks.keys.find(
          (key) => key.kid === decodedToken.header.kid
        );

        if (!signingKey) {
          throw new Error("Invalid token: Signing key not found");
        }

        // Convert JWK to PEM
        const pem = jwkToPem(signingKey);

        // Verify the token
        jwt.verify(token, pem, { algorithms: ["RS256"] }, (err, verifiedToken) => {
          if (err) {
            return res.status(401).json({ error: "Invalid token" });
          }

          // Attach the verified token to the request object
          req.user = verifiedToken;
          next();
        });
      })
      .catch((err) => {
        res.status(401).json({ error: "Failed to verify token", details: err.message });
      });
  } catch (err) {
    res.status(401).json({ error: "Invalid token format", details: err.message });
  }
};

const verifyInternalKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey === process.env.INTERNAL_API_KEY) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
};


module.exports = {authenticate, verifyInternalKey};