const fs = require('fs');

async function runTest() {
  const dummyJpg = Buffer.from("ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc00011080001000103012200021101031101ffc4001500010100000000000000000000000000000008ffc40014100100000000000000000000000000000000ffc4001501010100000000000000000000000000000009ffc40014110100000000000000000000000000000000ffda000c03010002110311003f00300097fffd", "hex");
  
  const fd = new FormData();
  fd.append('images', new Blob([dummyJpg], { type: 'image/jpeg' }), 'dummy1.jpg');
  fd.append('images', new Blob([dummyJpg], { type: 'image/jpeg' }), 'dummy2.jpg');

  console.log("Starting upload...");
  const start = Date.now();
  
  try {
    const res = await fetch('http://localhost:3200/api/design-images/import', {
      method: 'POST',
      body: fd
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body:\n${text}`);
    const end = Date.now();
    console.log(`Total time: ${(end - start)} ms`);
  } catch (err) {
    console.error(err);
  }
}
runTest();
