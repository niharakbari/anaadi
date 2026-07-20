const controller = require('./src/controllers/designImageController');

const req = {};
const res = {
  json: (data) => console.log('Response:', data),
  status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) })
};
const next = (err) => console.error('Error:', err);

controller.deleteAllImages(req, res, next)
  .then(() => {
    console.log('Test complete');
    process.exit(0);
  });
