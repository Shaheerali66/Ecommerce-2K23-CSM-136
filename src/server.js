require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Kaarigar backend listening on port ${PORT}`); // eslint-disable-line no-console
});
