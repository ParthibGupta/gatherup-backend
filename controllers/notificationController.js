const AppDataSource = require("../config/database");
const { Notification } = require("../models/notifications");
const { EventAttendees } = require("../models/eventAttendees");
const notificationRepository = AppDataSource.getRepository(Notification);
const eventAttendeesRepository = AppDataSource.getRepository(EventAttendees);


// Get all notifications for a user
const getNotificationsByUserID = async (req, res) => {
    const userID = req.user.sub;
    try {
        if (!userID) {
            return res.status(400).json({ error: "User ID (sub) not found in request" });
        }
        const notifications = await notificationRepository.createQueryBuilder("notification")
            .leftJoinAndSelect("notification.event", "event")
            .leftJoinAndSelect("notification.user", "user")
            // .select([
            //     "notification.notificationID",
            //     "notification.eventID",
            //     "notification.userID",
            //     "notification.description",
            //     "notification.createdAt",
            //     "notification.updatedAt",
            //     "event.name",
            //     "user.fullName"
            // ])
            .where("notification.userID = :userID", { userID })
            .orderBy("notification.createdAt", "DESC")
            .getMany();

        if (notifications.length === 0) {
            return res.status(204).json({ message: "No notifications found for this user." });
        }

        res.status(200).json({message: "success", data: notifications});
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            message: "Error fetching notifications",
            error: error.message,
        });
    }
};

const createNotificationForOrganizer = async (req, res) => {
    const { organizerID, eventID, message } = req.body;

    try {
        if (!organizerID || !eventID || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const notification = createNotification({
            userID: organizerID,
            eventID,
            message,
        });

        res.status(201).json({
            message: "Notification created successfully",
            notification,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({
            error: "Failed to create notification",
            details: error.message,
        });
    }
};

const createNotificationForAttendees = async (eventID, message) => {
    try {
        if (!eventID || !message) {
            throw new Error("Missing required fields");
        }

        const attendees = await eventAttendeesRepository.find({
            where: { eventID }
        });

        if (attendees.length === 0) {
            throw new Error("No attendees found for this event");
        }

        const notifications = attendees.map(attendee => ({
            userID: attendee.userID,
            eventID,
            description: message,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        const savedNotifications = await notificationRepository.save(notifications);
        return {
            message: "Notifications created successfully for attendees",
            notifications: savedNotifications,
        };
    } catch (error) {
        console.error("Error creating notifications for attendees:", error);
        throw new Error("Failed to create notifications for attendees");
    }
};


const createNotification = async ({ userID, eventID, message }) => {
    console.log(userID, eventID, message);
    if (!userID || !eventID || !message) {
        throw new Error("Missing required fields for notification creation");
    }

    const notification = notificationRepository.create({
        userID,
        eventID,
        description: message,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return await notificationRepository.save(notification);
    
};

const updateNotification = async (req, res) => {
    const userID = req.user.sub;
    const { notificationID } = req.params;
    const { status } = req.body;

    if (!userID) {
        return res.status(400).json({ error: "User ID (sub) not found in request" });
    }
    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }
    try {
        const notification = await notificationRepository.findOne({
            where: { notificationID, userID }
        });
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        notification.status = status;
        await notificationRepository.save(notification);
        res.status(200).json({ message: "Notification updated successfully", notification });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({
            message: "Error updating notification",
            error: error.message,
        });
    }
};

const deleteNotification = async (req, res) => {
    const userID = req.user.sub;
    const { notificationID } = req.params;
    if (!userID) {
        return res.status(400).json({ error: "User ID (sub) not found in request" });
    }
    try {
        const notification = await notificationRepository.findOne({
            where: { notificationID, userID }
        });
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        await notificationRepository.remove(notification);
        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({
            message: "Error deleting notification",
            error: error.message,
        });
    }
};

module.exports = {
    getNotificationsByUserID,
    createNotificationForOrganizer,
    createNotificationForAttendees,
    createNotification,
    updateNotification,
    deleteNotification,
};