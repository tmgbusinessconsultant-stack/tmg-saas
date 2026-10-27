const bcrypt = require('bcrypt');
const hash = 'PASTE_FULL_HASH_HERE';
async function run() {
  const passwords = ['Admin@TMG2026!Secure','Admin@TMG2026!','admin123','TMG2026!'];
  for (const pwd of passwords) {
    console.log(pwd, await bcrypt.compare(pwd, hash));
  }
}
run();
