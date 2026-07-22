const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

async function runTest() {
  // Create a 1x1 dummy jpeg in memory to upload
  const dummyJpg = Buffer.from("ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc00011080001000103012200021101031101ffc4001500010100000000000000000000000000000008ffc40014100100000000000000000000000000000000ffc4001501010100000000000000000000000000000009ffc40014110100000000000000000000000000000000ffda000c03010002110311003f00300097fffd", "hex");
  
  fs.writeFileSync('dummy1.jpg', dummyJpg);
  fs.writeFileSync('dummy2.jpg', dummyJpg);
  fs.writeFileSync('dummy3.jpg', dummyJpg);

  const form = new FormData();
  form.append('images', fs.createReadStream('dummy1.jpg'));
  form.append('images', fs.createReadStream('dummy2.jpg'));
  form.append('images', fs.createReadStream('dummy3.jpg'));

  console.log("Starting upload benchmark...");
  const start = Date.now();

  const options = {
    hostname: 'localhost',
    port: 3200,
    path: '/api/design-images/import',
    method: 'POST',
    headers: form.getHeaders()
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk.trim()}`);
    });
    res.on('end', () => {
      const end = Date.now();
      console.log(`Total time: ${(end - start)} ms`);
      fs.unlinkSync('dummy1.jpg');
      fs.unlinkSync('dummy2.jpg');
      fs.unlinkSync('dummy3.jpg');
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  form.pipe(req);
}

runTest();
