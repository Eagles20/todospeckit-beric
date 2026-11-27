// Server-side login session. The client sends the token as Authorization: Bearer <token>.
export default (sequelize, Sequelize) => {
  const Session = sequelize.define(
    "session",
    {
      // Auto-increment primary key (sessions.id).
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // JWT stored on the server so we can look it up and revoke it.
      token: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // Email copied from the user at login time.
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // Session ends 24 hours after it is created.
      expirationDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      // Which user this session belongs to (users.id).
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "sessions",
      // Spec columns only; do not add createdAt / updatedAt.
      timestamps: false,
    }
  );

  return Session;
};
