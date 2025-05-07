const { EntitySchema } = require("typeorm");

const EventAttendees = new EntitySchema({
  name: "EventAttendees",
  tableName: "eventattendees",
  columns: {
    eventID: {
      type: "uuid",
      primary: true,
    },
    userID: {
      type: "uuid",
      primary: true,
    },
    rsvpStatus: {
      type: "boolean",
      default: true,
    },
    createdAt: {
      type: "timestamp with time zone",
      createDate: true,
    },
  },
  relations: {
    event: {
      type: "many-to-one",
      target: "Event",
      joinColumn: {
        name: "eventID",
        referencedColumnName: "eventID",
      },
      inverseSide: "eventAttendees",
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userID",
        referencedColumnName: "userID",
      },
      inverseSide: "attendedEvents",
    },
  },
});

module.exports = { EventAttendees };
