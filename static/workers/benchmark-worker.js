/* Isolated same-origin Web Worker for /benchmark (WASM sandbox + parallel prime counting). */

function fibJs(k) {
  if (k < 2) return k;
  return fibJs(k - 1) + fibJs(k - 2);
}

function isPrime(x) {
  if (x < 2) return false;
  if (x === 2) return true;
  if (x % 2 === 0) return false;
  for (let d = 3; d * d <= x; d += 2) {
    if (x % d === 0) return false;
  }
  return true;
}

self.onmessage = async (e) => {
  const data = e.data || {};
  try {
    if (data.task === 'fib_wasm') {
      const {n, wasmBytes} = data;
      const t0 = performance.now();
      const jsVal = fibJs(n);
      const jsMs = performance.now() - t0;

      const {instance} = await WebAssembly.instantiate(new Uint8Array(wasmBytes));
      const t1 = performance.now();
      const wasmVal = instance.exports.fib(n);
      const wasmMs = performance.now() - t1;

      self.postMessage({ok: true, jsVal, jsMs, wasmVal, wasmMs});
      return;
    }

    if (data.task === 'primes') {
      const {start, end, step = 1} = data;
      let count = 0;
      for (let x = start; x <= end; x += step) {
        if (isPrime(x)) count += 1;
      }
      self.postMessage({ok: true, count});
      return;
    }

    self.postMessage({ok: false, error: 'Unknown worker task'});
  } catch (err) {
    self.postMessage({ok: false, error: err && err.message ? err.message : String(err)});
  }
};
