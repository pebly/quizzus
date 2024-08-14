const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./database');
const gameRoutes = require('./routes/gameRoutes');


app.use(cors());
app.use(bodyParser.json());

app.use('/api', gameRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
