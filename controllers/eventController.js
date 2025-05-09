const AppDataSource = require("../config/database");
const { Event } = require("../models/event");
const { User } = require("../models/user");
const { EventAttendees } = require("../models/eventAttendees");
const { stat } = require("fs");
const { sendUpdateEmail } = require("../controllers/emailController");

const eventRepository = AppDataSource.getRepository(Event);
const userRepository = AppDataSource.getRepository(User);
const eventAttendeesRepository = AppDataSource.getRepository(EventAttendees);

// As an organizer, I want to create an event so that I can invite and allow users to join it.
const createEvent = async (req, res) => {
  const {
    name,
    description,
    eventDate,
    locationTitle,
    location,
    bannerURL,
    capacity,
    category,
  } = req.body;

  try {
    const organizer = req.user.sub;
    console.log(organizer);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const event = eventRepository.create({
      name,
      description,
      eventDate: new Date(eventDate),
      locationTitle,
      location,
      bannerURL,
      capacity,
      category,
      organizer,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedEvent = await eventRepository.save(event);

    res.status(201).json({
      message: "Event created successfully",
      event: savedEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      message: "Error creating event",
      error: error.message,
    });
  }
};

//As an organizer, I want to view all events that I have organized so that I can manage them.
const getMyOrganizedEvents = async (req, res) => {
  const userID = req.user.sub;
  try {
    const events = await eventRepository.find({
      where: { organizer: { userID } },
      relations: ["organizer"],
    });
    res.status(200).json({
      message: "success",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching organized events:", error);
    res.status(500).json({
      message: "Error fetching organized events",
      error: error.message,
    });
  }
};

//As an organizer, I want to view a specific event that I have organized so that I can manage it.
const getMyOrganizedEventByID = async (req, res) => {
  const userID = req.user.sub;
  const { eventID } = req.params;
  try {
    const event = await eventRepository.findOne({
      where: { eventID },
      relations: ["organizer"],
    });

    if (!event || event.organizer !== userID) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      message: "Error fetching event",
      error: error.message,
    });
  }
};

//As an organizer, I want to update an event that I have organized so that I can manage it.
const updateMyOrganizedEventByID = async (req, res) => {
  const userID = req.user.sub;
  const { eventID } = req.params;
  const {
    name,
    description,
    eventDate,
    locationTitle,
    location,
    capacity,
    category,
  } = req.body;

  try {
    const event = await eventRepository.findOne({
      where: { eventID },
      relations: ["organizer"],
    });

    if (!event || event.organizer.userID !== userID) {
      return res.status(404).json({ message: "Event not found" });
    }

    await eventRepository.update(eventID, {
      name,
      description,
      eventDate: new Date(eventDate),
      locationTitle,
      location,
      capacity,
      category,
    });

    const updatedEvent = await eventRepository.findOne({
      where: { eventID },
      relations: ["organizer"],
    });

    const eventWithAttendees = await eventRepository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.organizer", "organizer")
      .leftJoinAndSelect("event.eventAttendees", "eventAttendees")
      .leftJoinAndSelect("eventAttendees.user", "user")
      .where("event.eventID = :eventID", { eventID })
      .getOne();
    
    const emails = eventWithAttendees.eventAttendees.map(attendee => attendee.user.email);

    const emailResponse = await sendUpdateEmail(emails, eventWithAttendees);
    console.log(emailResponse);
    res.status(200).json({
      status: "success",
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      status: "failed",
      message: "Error updating event",
      error: error.message,
    });
  }
};

//As an organizer, I want to delete an event that I have organized so that I can manage it.
const deleteMyOrganizedEventByID = async (req, res) => {
  const userID = req.user.sub;
  const { eventID } = req.params;
  try {
    const event = await eventRepository.findOne({
      where: { eventID },
      relations: ["organizer"],
    });

    if (!event || event.organizer.userID !== userID) {
      return res.status(404).json({ message: "Event not found" });
    }

    await eventRepository.delete(eventID);

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      message: "Error deleting event",
      error: error.message,
    });
  }
};

//As a user, I want to view all events so that I can find events to join.
const getAllEvents = async (req, res) => {
  try {
    const events = await eventRepository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.eventAttendees", "eventAttendees")
      .leftJoinAndSelect("eventAttendees.user", "user.userName")
      .orderBy("event.eventDate", "ASC")
      .limit(50)
      .getMany();
    res.status(200).json({ message: "succeess", events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      message: "Error fetching events",
      error: error.message,
    });
  }
};

//As a user, I want to view a specific event so that I can find out more about it.
const getEventByID = async (req, res) => {
  const { eventID } = req.params;
  try {

    const event = await eventRepository
    .createQueryBuilder("event")
    .leftJoinAndSelect("event.organizer", "organizer")
    .leftJoinAndSelect("event.eventAttendees", "eventAttendees")
    .leftJoinAndSelect("eventAttendees.user", "user")
    .where("event.eventID = :eventID", { eventID })
    .getOne();

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Simplify attendees to only include userID and fullName
    const simplifiedAttendees = event.eventAttendees.map(attendee => ({
      userID: attendee.user?.userID,
      fullName: attendee.user?.fullName,
    }));

    // Clone and transform the event object
    const { eventAttendees, ...restEvent } = event;
    const transformedEvent = {
      ...restEvent,
      eventAttendees: simplifiedAttendees,
    };

    res.status(200).json({
      message: "success",
      data: transformedEvent,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      message: "Error fetching event",
      error: error.message,
    });
  }
};

//As a user, I want to join an event so that I can participate in it.
const joinEventByID = async (req, res) => {
  console.log("join event");
  const userID = req.user.sub;
  const { eventID } = req.params;

  try {
    const event = await eventRepository.findOne({ where: { eventID } });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existingAttendee = await eventAttendeesRepository.exists({
      where: {
        user: { userID },
        event: { eventID },
      },
    });
    if (existingAttendee) {
      return res.status(400).json({ message: "Already joined the event" });
    }

    const user = await userRepository.findOneBy({ userID });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const attendeeCount = await eventAttendeesRepository.count({
      where: { event: { eventID } },
    });

    if (attendeeCount >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }

    const eventAttendee = eventAttendeesRepository.create({
      user,
      event,
      joinedAt: new Date(),
      rsvpStatus: true,
    });
    await eventAttendeesRepository.save(eventAttendee);

    res.status(200).json({
      message: "Successfully joined the event",
    });
  } catch (error) {
    console.error("Error joining event:", error);
    res.status(500).json({
      message: "Error joining event",
      error: error.message,
    });
  }
};

//As a user, I want to view all attendees of an event so that I can see who else is attending.
const getEventAttendeesByID = async (req, res) => {
  const { eventID } = req.params;
  try {
    const event = await eventRepository.findOne({ where: { eventID } });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attendees = await eventAttendeesRepository.find({
      where: { event: { eventID } },
      relations: ["user"],
    });

    res.status(200).json(attendees);
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    res.status(500).json({
      message: "Error fetching event attendees",
      error: error.message,
    });
  }
};

//As a user, I want to leave an event so that I can stop participating in it.
const leaveEventByID = async (req, res) => {
  const userID = req.user.sub;
  const { eventID } = req.params;
  try {
    const event = await eventRepository.findOne({ where: { eventID } });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const attendee = await eventAttendeesRepository.findOne({
      where: {
        user: { userID },
        event: { eventID },
      },
    });
    if (!attendee) {
      return res.status(404).json({ message: "User not attending" });
    }
    await eventAttendeesRepository.delete(attendee.eventAttendeeID);
    res.status(200).json({
      message: "Successfully left the event",
    });
  } catch (error) {
    console.error("Error leaving event:", error);
    res.status(500).json({
      message: "Error leaving event",
      error: error.message,
    });
  }
};

//As a user, I want to view all events that I have joined so that I can manage them.
const getMyJoinedEvents = async (req, res) => {
  const userID = req.user.sub;

  try {

    const events = await eventAttendeesRepository.find({
      where: { user: { userID } },
      relations: ["event"],
    });

    const joinedEvents = events.map((attendee) => attendee.event);
    if (joinedEvents.length === 0) {
      return res.status(200).json({ message: "No joined events found", data: [] });
    }
    res.status(200).json({
      message: "success",
      data: joinedEvents,
    });
  } catch (error) {
    console.error("Error fetching joined events:", error);
    res.status(500).json({
      message: "Error fetching joined events",
      error: error.message,
    });
  }
};

module.exports = {
  createEvent,
  getMyOrganizedEvents,
  getMyOrganizedEventByID,
  updateMyOrganizedEventByID,
  deleteMyOrganizedEventByID,
  getAllEvents,
  getEventByID,
  joinEventByID,
  getEventAttendeesByID,
  leaveEventByID,
  getMyJoinedEvents
};
