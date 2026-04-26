require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected!');
  await mongoose.connection.collection('inventories').deleteMany({});
  console.log('✅ All inventories cleared!');
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit();
});