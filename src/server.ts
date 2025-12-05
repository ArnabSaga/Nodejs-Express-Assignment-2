import app from "./app";
import config from "./config";

const port = config.port;

app.listen(port, () => {
  console.log(`The Vehicle Rental System is listen on this port ${port}`);
});
