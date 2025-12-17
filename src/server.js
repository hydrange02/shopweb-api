require("dotenv").config();
const app = require("./app");
const { connectMongo, bindMongoLogs } = require("./db/mongoose");

const PORT = process.env.PORT || 4000;

(async () => {
  bindMongoLogs();
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`▶ Shoply API listening at http://localhost:${PORT}`);
  });
})();