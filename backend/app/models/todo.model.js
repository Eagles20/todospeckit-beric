// One task inside a list. The signed-in user owns it.
export default (sequelize, Sequelize) => {
  const Todo = sequelize.define(
    "todo",
    {
      // Auto-increment primary key (todos.id).
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // Which list this task belongs to. Deleting that list deletes these rows.
      listId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "lists",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      // The task text. Required, at most 255 characters.
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // A new task starts not done.
      completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Which user owns this task (users.id). The controller sets this from the session.
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
      tableName: "todos",
      // Spec includes createdAt and updatedAt.
      timestamps: true,
    }
  );

  return Todo;
};
