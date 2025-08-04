const { EntitySchema } = require("typeorm");

const Ticket = new EntitySchema({
  name: "Ticket",
  tableName: "tickets",
  columns: {
    ticketID: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    ticketNumber: {
      type: "text",
      unique: true,
    },
    qrCode: {
      type: "text",
      unique: true,
    },
    status: {
      type: "enum",
      enum: ["pending", "confirmed", "used", "revoked", "cancelled"],
      default: "pending",
    },
    purchaseDate: {
      type: "timestamp with time zone",
      createDate: true,
    },
    usedAt: {
      type: "timestamp with time zone",
      nullable: true,
    },
    revokedAt: {
      type: "timestamp with time zone",
      nullable: true,
    },
    revokedReason: {
      type: "text",
      nullable: true,
    },
    pdfUrl: {
      type: "text",
      nullable: true,
    },
    metadata: {
      type: "jsonb",
      nullable: true,
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
    event: {
      type: "many-to-one",
      target: "Event",
      inverseSide: "tickets",
      joinColumn: {
        name: "eventID",
      },
    },
    user: {
      type: "many-to-one",
      target: "User",
      inverseSide: "tickets",
      joinColumn: {
        name: "userID",
      },
    },
  },
});

module.exports = { Ticket };
