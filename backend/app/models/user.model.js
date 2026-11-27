// User account. Controllers call this factory from models/index.js.
export default (sequelize, Sequelize) => {
  const User = sequelize.define(
    "user",
    {
      // Auto-increment primary key (users.id).
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // First name. Required.
      fName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // Last name. Required.
      lName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // Email must be unique. Login still uses username, not email.
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      // Username is unique and always saved in lowercase (e.g. "JDoe" becomes "jdoe").
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        set(value) {
          if (typeof value === "string") {
            this.setDataValue("username", value.trim().toLowerCase());
          } else {
            this.setDataValue("username", value);
          }
        },
      },
      // Store a bcrypt hash here, never the plain password.
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // New accounts are workers unless a later feature says otherwise.
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "worker",
      },
    },
    {
      tableName: "users",
      // Spec columns only; do not add createdAt / updatedAt.
      timestamps: false,
      // Hide the password hash on normal queries. Login uses User.unscoped().
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
    }
  );

  return User;
};
