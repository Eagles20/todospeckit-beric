// A named todo list owned by one user. Todos inside the list come in Feature 3.
export default (sequelize, Sequelize) => {
  const List = sequelize.define(
    "list",
    {
      // Auto-increment primary key (lists.id).
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // The name shown on the dashboard. Required, at most 100 characters.
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      // Which user owns this list (users.id). The controller sets this from the session.
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
      tableName: "lists",
      // Spec includes createdAt and updatedAt, so Sequelize timestamps stay on.
      timestamps: true,
    }
  );

  return List;
};
