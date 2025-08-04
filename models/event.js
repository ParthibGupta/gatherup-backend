const { EntitySchema } = require("typeorm");
const Event = new EntitySchema({
  name: "Event",
  tableName: "events",
  columns: {
    eventID: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "text",
    },
    description: {
      type: "text",
    },
    eventDate: {
      type: "timestamp with time zone",
    },
    locationTitle: {
      type: "text",
    },
    location: {
      type: "text",
    },
    capacity: {
      type: "integer",
    },
    category: {
      type: "text",
    },
    bannerURL: {
      type: "text",
    },
    ticketingEnabled: {
      type: "boolean",
      default: false,
    },
    ticketPrice: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    requiresApproval: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp with time zone",
      updateDate: true,
    },
  },
  relations: {
    organizer: {
      type: "many-to-one",
      target: "User",
      inverseSide: "organizedEvents",
    },
    eventAttendees: {
      type: "one-to-many",
      target: "EventAttendees",
      inverseSide: "event",
    },
    waitlistUsers: {
      type: "one-to-many",
      target: "Waitlist",
      inverseSide: "event",
    },
    notifications: {
      type: "one-to-many",
      target: "Notification",
      inverseSide: "event",
    },
    tickets: {
      type: "one-to-many",
      target: "Ticket",
      inverseSide: "event",
    },
  },
});

module.exports = { Event };
