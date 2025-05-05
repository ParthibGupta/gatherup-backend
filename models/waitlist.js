const { EntitySchema } = require("typeorm");

const Waitlist = new EntitySchema({
  name: "Waitlist",
  tableName: "waitlist",
  columns: {
    eventID: {
      type: "uuid",
      primary: true,
    },
    userID: {
      type: "uuid",
      primary: true,
    },
    createdAt: {
      type: "timestamp",
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
      inverseSide: "waitlistUsers",
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userID",
        referencedColumnName: "userID",
      },
      inverseSide: "waitlistedEvents",
    },
  },
});

module.exports = { Waitlist };
