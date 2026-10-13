
const Razorpay = require("razorpay");

let razorpayInstance = null;

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay Test Mode credentials are missing"
    );
  }

  if (!keyId.startsWith("rzp_test_")) {
    throw new Error(
      "Only Razorpay Test Mode is allowed"
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

module.exports = getRazorpayInstance;
