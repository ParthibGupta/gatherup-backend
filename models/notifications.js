const { EntitySchema } = require("typeorm");

const Notification = new EntitySchema({
  name: "Notification",
  tableName: "notifications",
  columns: {
    notificationID: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userID: {
      type: "text",
      nullable: false,
    },
    eventID: {
      type: "uuid",
      nullable: false,
    },
    description: {
      type: "text",
      nullable: false,
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
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userID",
        referencedColumnName: "userID",
      },
      inverseSide: "notifications",
    },
    event: {
      type: "many-to-one",
      target: "Event",
      joinColumn: {
        name: "eventID",
        referencedColumnName: "eventID",
      },
      inverseSide: "notifications",
    },
  },
});

module.exports = { Notification };
