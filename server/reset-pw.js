const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await mongoose.connect('mongodb+srv://sarauntp2_db_user:Saraun%403055@cluster0.nvaxgpy.mongodb.net/geofix?appName=Cluster0');
    const hash = await bcrypt.hash('Worker123!', 10);
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'worker1@gmail.com' },
      { $set: { passwordHash: hash } }
    );
    console.log('Matched count:', result.matchedCount);
    console.log('Modified count:', result.modifiedCount);
    console.log('Password successfully reset to Worker123!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
