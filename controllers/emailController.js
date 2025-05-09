const FormData = require("form-data"); // form-data v4.0.1
const Mailgun = require("mailgun.js"); // mailgun.js v11.1.0
const { format } = require("date-fns"); // Import date-fns

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "API_KEY",
});

async function sendUpdateEmail(recepients, event) {
  try {
    // Format the event date
    const formattedDate = format(new Date(event.eventDate), "EEEE, MMMM do, yyyy, h:mm a");

    const mailgunVariables = {
      event_name: event.name,
      event_date: formattedDate, 
      event_location: event.locationTitle,
      organizer_name: event.organizer.fullName,
      imageURL: event.bannerURL,
      event_url: "https://gatherup.club/event/" + event.eventID,
      update_message: "Please find the updated event details below.",
    };

    const data = await mg.messages.create(
      "sandbox9198cbb9ce624ae5add41aff1df7a080.mailgun.org",
      {
        from: "Mailgun Sandbox <postmaster@sandbox9198cbb9ce624ae5add41aff1df7a080.mailgun.org>",
        to: recepients,
        subject: "Changes For An Upcoming Event",
        template: "eventupdate",
        "h:X-Mailgun-Variables": JSON.stringify(mailgunVariables),
      }
    );
    console.log(data);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

const sendEventUpdateBulkEmail = async (req, res) => {
  const { recepients, event } = req.body;
  const response = await sendUpdateEmail(recepients, event);
  if (response) {
    return res
      .status(200)
      .json({ status: "success", message: "Email sent successfully" });
  } else {
    return res
      .status(500)
      .json({ status: "failed", message: "Failed to send email" });
  }
};

module.exports = { sendEventUpdateBulkEmail, sendUpdateEmail };