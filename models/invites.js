const { EntitySchema, ManyToOne, JoinColumn } = require("typeorm");

const Invite = new EntitySchema({
  name: "Invite",
  tableName: "invites",
  columns: {
    inviteID: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    eventID: {
      type: "uuid",
      nullable: false,
    },
    senderID: {
      type: "text",
      nullable: false,
    },
    receiverID: {
      type: "text",
      nullable: false,
    },
    status: {
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
    event: {
      type: "many-to-one",
      target: "Event",
      JoinColumn: {
        name: "eventID",
        referencedColumnName: "eventID",
      },
      inverseSide: "invites",
    },
    sender: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "senderID",
        referencedColumnName: "userID",
      },
      inverseSide: "sentInvites",
    },
    receiver: {
      type: "one-to-one",
      target: "User",
      joinColumn: {
        name: "receiverID",
        referencedColumnName: "userID",
      },
      inverseSide: "receivedInvites",
    },
  },
});

module.exports = { Invite };
