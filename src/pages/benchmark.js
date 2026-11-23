import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './benchmark.module.css';

// Hand-encoded 60-byte WebAssembly binary exporting: fib(n: i32) -> i32
const FIB_WASM_BYTES = [
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x06, 0x01, 0x60, 0x01, 0x7f, 0x01, 0x7f,
  0x03, 0x02, 0x01, 0x00,
  0x07, 0x07, 0x01, 0x03, 0x66, 0x69, 0x62, 0x00, 0x00,
  0x0a, 0x1e, 0x01, 0x1c, 0x00,
  0x20, 0x00, 0x41, 0x02, 0x48, 0x04, 0x7f,
  0x20, 0x00, 0x05,
  0x20, 0x00, 0x41, 0x01, 0x6b, 0x10, 0x00,
  0x20, 0x00, 0x41, 0x02, 0x6b, 0x10, 0x00,
  0x6a, 0x0b, 0x0b,
];

// Hand-encoded 106-byte WebAssembly binary exporting: fib_iter(n: i32) -> i32 (mod 1,000,000,007)
const FIB_ITER_WASM_BYTES = [
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x06, 0x01, 0x60, 0x01, 0x7f, 0x01, 0x7f,
  0x03, 0x02, 0x01, 0x00,
  0x07, 0x0c, 0x01, 0x08, 0x66, 0x69, 0x62, 0x5f, 0x69, 0x74, 0x65, 0x72, 0x00, 0x00,
  0x0a, 0x46, 0x01, 0x44, 0x01, 0x04, 0x7f,
  0x20, 0x00, 0x41, 0x02, 0x48, 0x04, 0x40, 0x20, 0x00, 0x0f, 0x0b,
  0x41, 0x00, 0x21, 0x01, 0x41, 0x01, 0x21, 0x02, 0x41, 0x02, 0x21, 0x04,
  0x03, 0x40,
  0x20, 0x01, 0x20, 0x02, 0x6a, 0x41, 0x87, 0x94, 0xeb, 0xdc, 0x03, 0x70, 0x21, 0x03,
  0x20, 0x02, 0x21, 0x01, 0x20, 0x03, 0x21, 0x02, 0x20, 0x04, 0x41, 0x01, 0x6a, 0x21, 0x04,
  0x20, 0x04, 0x20, 0x00, 0x4c, 0x0d, 0x00, 0x0b,
  0x20, 0x02, 0x0b,
];

const SANDBOX_TIMEOUT_MS = 30000;
const WORKER_URL = '/workers/benchmark-worker.js';

function runWasmSandboxWorker(mode, n) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_URL);
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error(`Sandbox watchdog terminated execution after ${SANDBOX_TIMEOUT_MS / 1000} s.`));
    }, SANDBOX_TIMEOUT_MS);

    worker.onmessage = (e) => {
      window.clearTimeout(timer);
      worker.terminate();
      if (e.data && e.data.ok) {
        resolve(e.data);
      } else {
        reject(new Error((e.data && e.data.error) || 'Worker execution failed'));
      }
    };
    worker.onerror = (err) => {
      window.clearTimeout(timer);
      worker.terminate();
      reject(new Error(err.message || 'Worker execution failed'));
    };
    const isIter = mode === 'iterative';
    worker.postMessage({
      task: isIter ? 'fib_iter_wasm' : 'fib_wasm',
      n,
      wasmBytes: isIter ? FIB_ITER_WASM_BYTES : FIB_WASM_BYTES,
    });
  });
}

function runPrimeSliceWorker(start, end) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_URL);
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error(`Parallel worker timed out after ${SANDBOX_TIMEOUT_MS / 1000} s.`));
    }, SANDBOX_TIMEOUT_MS);

    worker.onmessage = (e) => {
      window.clearTimeout(timer);
      worker.terminate();
      if (e.data && e.data.ok) {
        resolve(e.data.count);
      } else {
        reject(new Error((e.data && e.data.error) || 'Parallel worker failed'));
      }
    };
    worker.onerror = (err) => {
      window.clearTimeout(timer);
      worker.terminate();
      reject(new Error(err.message || 'Parallel worker failed'));
    };
    worker.postMessage({task: 'primes', start, end});
  });
}

async function runParallelPrimeBenchmark(limit, threads) {
  const t0 = performance.now();
  const chunk = Math.ceil((limit - 1) / threads);
  const tasks = [];
  for (let i = 0; i < threads; i += 1) {
    const start = 2 + i * chunk;
    const end = Math.min(limit, start + chunk - 1);
    if (start <= end) tasks.push(runPrimeSliceWorker(start, end));
  }
  const counts = await Promise.all(tasks);
  const elapsedMs = performance.now() - t0;
  const totalPrimes = counts.reduce((a, b) => a + b, 0);
  return {threads, elapsedMs, totalPrimes};
}

export default function BenchmarkPage() {
  const [fibMode, setFibMode] = useState('recursive'); // 'recursive' | 'iterative'
  const [fibN, setFibN] = useState(38);
  const [fibIterN, setFibIterN] = useState(50000000);
  const [wasmRunning, setWasmRunning] = useState(false);
  const [wasmResult, setWasmResult] = useState(null);
  const [wasmError, setWasmError] = useState('');

  const [cores, setCores] = useState(4);
  const [primeLimit, setPrimeLimit] = useState(600000);
  const [seqFraction, setSeqFraction] = useState(10); // % sequential for Amdahl's Law
  const [hpcRunning, setHpcRunning] = useState(false);
  const [hpcRows, setHpcRows] = useState([]);
  const [hpcError, setHpcError] = useState('');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      setCores(Math.max(2, Math.min(16, navigator.hardwareConcurrency)));
    }
  }, []);

  const threadCounts = useMemo(() => {
    const list = [1];
    let p = 2;
    while (p < cores) {
      list.push(p);
      p *= 2;
    }
    if (cores > 1 && !list.includes(cores)) list.push(cores);
    return list;
  }, [cores]);

  async function handleRunWasm() {
    setWasmRunning(true);
    setWasmError('');
    const n = fibMode === 'iterative' ? fibIterN : fibN;
    try {
      const res = await runWasmSandboxWorker(fibMode, n);
      setWasmResult({...res, n, mode: fibMode});
    } catch (err) {
      setWasmError(err.message);
    } finally {
      setWasmRunning(false);
    }
  }

  async function handleRunHpc() {
    setHpcRunning(true);
    setHpcError('');
    setHpcRows([]);
    try {
      const out = [];
      let baseMs = null;
      for (const p of threadCounts) {
        const res = await runParallelPrimeBenchmark(primeLimit, p);
        if (baseMs === null) baseMs = res.elapsedMs;
        const speedup = baseMs / res.elapsedMs;
        const efficiency = (speedup / p) * 100;
        out.push({
          ...res,
          speedup,
          efficiency,
        });
        setHpcRows([...out]);
      }
    } catch (err) {
      setHpcError(err.message);
    } finally {
      setHpcRunning(false);
    }
  }

  const s = seqFraction / 100;

  return (
    <Layout
      title="Sandbox & Parallel Benchmark (WASM · HPC)"
      description="Run isolated WebAssembly vs. JavaScript benchmarks and multi-core parallel speedup tests directly in your browser.">
      <main className={styles.main}>
        <p className={styles.eyebrow}>Browser Sandbox · WebAssembly · Multi-Core HPC</p>
        <h1 className={styles.title}>Algorithm Benchmark Lab</h1>
        <p className={styles.intro}>
          Measure real execution times right inside your browser using isolated{' '}
          <strong>Web Workers</strong> (no server load, 30-second watchdog timeout) and compare{' '}
          <strong>JavaScript vs. WebAssembly</strong> and <strong>multi-core speedup vs. Amdahl’s Law</strong>.
        </p>

        {/* ── Lab 1: Sandbox JS vs WebAssembly ───────────────────────────── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>1. Isolated Sandbox: JavaScript vs. WebAssembly (WASM)</h2>
              <p className={styles.cardHint}>
                Compare JavaScript against embedded <code>.wasm</code> binaries inside an isolated same-origin Web Worker with a 30 s watchdog. Switch between <strong>Naive Recursive <code>O(φ<sup>n</sup>)</code></strong> (up to <code>n = 46</code>) and <strong>Iterative DP <code>O(n)</code></strong> (up to <code>n = 100,000,000</code>, mod <code>10<sup>9</sup>+7</code>) to see both language speedup and algorithmic complexity in action.{' '}
                <Link to="/concepts/principles-of-algorithmics/measuring-efficiency">Chapter 1 →</Link>
              </p>
            </div>
          </div>

          <div className={styles.modeRow} role="group" aria-label="Fibonacci algorithm mode">
            <button
              type="button"
              className={`${styles.modeBtn} ${fibMode === 'recursive' ? styles.modeBtnActive : ''}`}
              onClick={() => { setFibMode('recursive'); setWasmError(''); }}>
              Naive Recursive · O(φⁿ) (n ≤ 46)
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${fibMode === 'iterative' ? styles.modeBtnActive : ''}`}
              onClick={() => { setFibMode('iterative'); setWasmError(''); }}>
              Iterative DP · O(n) (n ≤ 100M)
            </button>
          </div>

          <div className={styles.controls}>
            {fibMode === 'recursive' ? (
              <label className={styles.label}>
                Input <code>n</code>: <strong>{fibN}</strong> {fibN >= 45 ? '(very heavy — may approach 30s watchdog)' : ''}
                <input
                  type="range"
                  min={28}
                  max={46}
                  value={fibN}
                  onChange={(e) => setFibN(Number(e.target.value))}
                  className={styles.slider}
                />
              </label>
            ) : (
              <label className={styles.label}>
                Input <code>n</code>: <strong>{fibIterN.toLocaleString()}</strong> (<code>fib(n) mod 10<sup>9</sup>+7</code>)
                <input
                  type="range"
                  min={1000000}
                  max={100000000}
                  step={1000000}
                  value={fibIterN}
                  onChange={(e) => setFibIterN(Number(e.target.value))}
                  className={styles.slider}
                />
              </label>
            )}
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={wasmRunning}
              onClick={handleRunWasm}>
              {wasmRunning ? 'Running in sandbox…' : '▶ Run JS vs. WASM'}
            </button>
          </div>

          {wasmError && <p className={styles.error} role="alert">{wasmError}</p>}

          {wasmResult && (
            <div className={styles.metricsGrid}>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>
                  {wasmResult.mode === 'iterative'
                    ? `fib(${wasmResult.n.toLocaleString()}) mod 10⁹+7`
                    : `Result fib(${wasmResult.n})`}
                </span>
                <span className={styles.metricVal}>{wasmResult.wasmVal.toLocaleString()}</span>
                <span className={styles.metricSub}>
                  Verified identical: {wasmResult.jsVal === wasmResult.wasmVal ? '✓ Yes' : '✗ Mismatch'}
                </span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>JavaScript (Worker)</span>
                <span className={styles.metricVal}>{wasmResult.jsMs.toFixed(1)} ms</span>
                <span className={styles.metricSub}>JIT-compiled V8 / SpiderMonkey</span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>WebAssembly (.wasm)</span>
                <span className={styles.metricVal}>{wasmResult.wasmMs.toFixed(1)} ms</span>
                <span className={styles.metricSub}>
                  {wasmResult.mode === 'iterative' ? '106-byte .wasm loop' : '60-byte .wasm recursion'}
                </span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>WASM Speedup</span>
                <span className={styles.metricVal}>
                  {(wasmResult.jsMs / Math.max(0.01, wasmResult.wasmMs)).toFixed(2)}×
                </span>
                <span className={styles.metricSub}>Higher = faster WebAssembly</span>
              </div>
            </div>
          )}

          <details className={styles.explainer}>
            <summary>What do these concepts mean? (O(φⁿ) vs O(n), Web Worker sandbox, Watchdog, WASM)</summary>
            <ul className={styles.explainerList}>
              <li>
                <strong><code>O(φ<sup>n</sup>)</code> vs. <code>O(n)</code>:</strong> <code>φ = (1 + √5) / 2 ≈ 1.618</code> is the <em>golden ratio</em>. Naive recursive Fibonacci multiplies work by ~1.618× per step (so <code>n = 46</code> takes billions of calls), whereas Iterative DP runs in linear <code>O(n)</code> time and computes <code>n = 50,000,000</code> in a fraction of a second (using <code>mod 10<sup>9</sup>+7</code> to stay inside 32-bit integers).
              </li>
              <li>
                <strong>Isolated Web Worker (sandbox):</strong> a separate background thread loaded from a static same-origin script (<code>/workers/benchmark-worker.js</code>) with <em>no access to the DOM, cookies, or localStorage</em>, keeping the interface responsive while heavy computations run.
              </li>
              <li>
                <strong>Watchdog timeout (30 s):</strong> a safety timer on the main thread that forcefully kills (<code>worker.terminate()</code>) any execution exceeding 30 seconds so a runaway job can never freeze the browser.
              </li>
              <li>
                <strong>WebAssembly (<code>.wasm</code>):</strong> a compact binary instruction format (60 bytes for recursive <code>fib</code>, 106 bytes for iterative <code>fib_iter</code>) compiled directly to native machine code by the browser without JavaScript’s dynamic-typing overhead.
              </li>
              <li>
                <strong>WASM Speedup (<code>T<sub>JS</sub> / T<sub>WASM</sub></code>):</strong> how many times faster WebAssembly ran than JavaScript on the exact same algorithm (<code>&gt; 1.0×</code> means WASM is faster).
              </li>
            </ul>
          </details>
        </section>

        {/* ── Lab 2: Parallel Computing (HPC & Amdahl's Law) ─────────────── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>2. Multi-Core Parallelism (HPC) vs. Amdahl’s Law</h2>
              <p className={styles.cardHint}>
                Counts prime numbers up to <code>N</code> in parallel across <code>1..{cores}</code> concurrent Web Workers (detected <strong>{cores}</strong> logical CPU cores on this device) and compares empirical speedup <code>S(p)</code> and efficiency <code>E(p)</code> with Amdahl’s Law.{' '}
                <Link to="/concepts/parallel-algorithms/parallel-performance">Chapter 9 →</Link>
              </p>
            </div>
          </div>

          <div className={styles.controls}>
            <label className={styles.label}>
              Upper bound <code>N</code>: <strong>{primeLimit.toLocaleString()}</strong>
              <input
                type="range"
                min={200000}
                max={1500000}
                step={100000}
                value={primeLimit}
                onChange={(e) => setPrimeLimit(Number(e.target.value))}
                className={styles.slider}
              />
            </label>
            <label className={styles.label}>
              Amdahl sequential fraction <code>s</code>: <strong>{seqFraction}%</strong> (max speedup: {seqFraction === 0 ? '∞' : `${(1 / s).toFixed(1)}×`})
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={seqFraction}
                onChange={(e) => setSeqFraction(Number(e.target.value))}
                className={styles.slider}
              />
            </label>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={hpcRunning}
              onClick={handleRunHpc}>
              {hpcRunning ? 'Benchmarking cores…' : `▶ Run Parallel Benchmark (1..${cores} workers)`}
            </button>
          </div>

          {hpcError && <p className={styles.error} role="alert">{hpcError}</p>}

          {hpcRows.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Workers (p)</th>
                    <th scope="col">Primes Found</th>
                    <th scope="col">Wall Time (ms)</th>
                    <th scope="col">Measured Speedup S(p)</th>
                    <th scope="col">Efficiency E(p)</th>
                    <th scope="col">Amdahl Theoretical (s={seqFraction}%)</th>
                  </tr>
                </thead>
                <tbody>
                  {hpcRows.map((row) => {
                    const amdahl = 1 / (s + (1 - s) / row.threads);
                    return (
                      <tr key={row.threads}>
                        <td><strong>{row.threads}</strong></td>
                        <td className={styles.mono}>{row.totalPrimes.toLocaleString()}</td>
                        <td className={styles.mono}>{row.elapsedMs.toFixed(1)} ms</td>
                        <td className={styles.mono}><strong>{row.speedup.toFixed(2)}×</strong></td>
                        <td className={styles.mono}>{row.efficiency.toFixed(1)}%</td>
                        <td className={styles.mono}>{amdahl.toFixed(2)}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <details className={styles.explainer}>
            <summary>What do these metrics mean? (Workers p, Speedup S(p), Efficiency E(p), Amdahl’s Law)</summary>
            <ul className={styles.explainerList}>
              <li>
                <strong>Workers (<code>p</code>):</strong> number of concurrent Web Workers running in parallel, each testing a disjoint sub-range of <code>[2..N]</code> across your CPU’s logical cores (<code>navigator.hardwareConcurrency</code>).
              </li>
              <li>
                <strong>Wall Time (<code>T(p)</code>):</strong> total elapsed time in milliseconds from launching all <code>p</code> workers until the slowest worker finishes.
              </li>
              <li>
                <strong>Measured Speedup <code>S(p) = T(1) / T(p)</code>:</strong> how many times faster <code>p</code> workers ran compared to 1 worker. Ideal linear scaling would be <code>S(p) = p</code> (e.g., 4× faster on 4 cores).
              </li>
              <li>
                <strong>Efficiency <code>E(p) = (S(p) / p) × 100%</code>:</strong> fraction of theoretical linear speedup actually achieved per core (100% = perfect scaling; lower values reflect worker startup, message-passing overhead, and the fact that larger numbers take longer to test for primality).
              </li>
              <li>
                <strong>Amdahl’s Law <code>S<sub>Amdahl</sub>(p) = 1 / (s + (1 − s) / p)</code>:</strong> theoretical ceiling on speedup when a fraction <code>s</code> of the program is strictly sequential. Even with infinite cores (<code>p → ∞</code>), speedup can never exceed <code>1 / s</code> (e.g., <code>s = 10%</code> caps speedup at <code>10×</code>).
              </li>
            </ul>
          </details>
        </section>
      </main>
    </Layout>
  );
}
