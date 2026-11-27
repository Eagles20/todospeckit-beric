import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import listModel from "./list.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Build the models and attach them so other files can use db.user, db.session, and db.list.
db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.list = listModel(sequelize, Sequelize);

// One user can have many sessions. Each session belongs to one user via userId.
db.user.hasMany(db.session, { foreignKey: "userId" });
db.session.belongsTo(db.user, { foreignKey: "userId" });

// One user can have many lists. Each list belongs to one user via userId.
db.user.hasMany(db.list, { foreignKey: "userId" });
db.list.belongsTo(db.user, { foreignKey: "userId" });

export default db;
