const url = process.argv[2] || 'http://localhost:4000/api/bookings/slots';
const bursts = Number(process.argv[3] || 2);
const perBurst = Number(process.argv[4] || 60);
const delayMs = Number(process.argv[5] || 2000);

function doFetch(u) {
  if (typeof fetch === 'function') return fetch(u);
  return new Promise((resolve, reject) => {
    const lib = u.startsWith('https') ? require('https') : require('http');
    lib.get(u, (res) => {
      // drain
      res.on('data', () => {});
      res.on('end', () => {});
      resolve({ status: res.statusCode });
    }).on('error', (e) => reject(e));
  });
}

(async () => {
  const totals = {};
  console.log('Target:', url, 'bursts:', bursts, 'per burst:', perBurst, 'delayMs:', delayMs);
  for (let b = 0; b < bursts; b++) {
    const ps = [];
    for (let i = 0; i < perBurst; i++) {
      ps.push(doFetch(url).then(r => r.status || 200).catch(() => 'ERR'));
    }
    const statuses = await Promise.all(ps);
    const bucket = statuses.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    console.log(`Burst ${b+1} results:`, bucket);
    for (const k of Object.keys(bucket)) totals[k] = (totals[k] || 0) + bucket[k];
    if (b < bursts - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  console.log('Aggregate results:', totals);
  process.exit(0);
})();
