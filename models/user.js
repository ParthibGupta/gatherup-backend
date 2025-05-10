const { EntitySchema } = require("typeorm");

const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    userID: {
      type: "text",
      primary: true,
    },
    userName: {
      type: "text",
      nullable: false,
      unique: true,
    },
    fullName: {
      type: "text",
      nullable: false,
      unique: false,
    },
    email: {
      type: "text",
      nullable: false,
      unique: true,
    },
    userDescription: {
      type: "text",
      nullable: true,
    },
    location: {
      type: "numeric",
      array: true,
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    organizedEvents: {
      type: "one-to-many",
      target: "Event",
      inverseSide: "organizer",
    },
    attendedEvents: {
      type: "one-to-many",
      target: "EventAttendees",
      inverseSide: "user",
    },
    waitlistedEvents: {
      type: "one-to-many",
      target: "Waitlist",
      inverseSide: "user",
    },
    notifications: {
      type: "one-to-many",
      target: "Notification",
      inverseSide: "user",
    },
    sentInvites: {
      type: "one-to-many",
      target: "Invite",
      inverseSide: "sender",
    },
    receivedInvites: {
      type: "one-to-many",
      target: "Invite",
      inverseSide: "receiver",
    },
  },
});

module.exports = { User };
