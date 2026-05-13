import React, { useState, useEffect, useMemo } from 'react';

export default function DPVisualizer() {
  const [coinsInput, setCoinsInput] = useState('1, 3, 4');
  const [amountInput, setAmountInput] = useState(6);
  
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Motor de cálculo: Genera el historial de pasos para poder navegar por ellos
  const generateSteps = () => {
    const coins = coinsInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    const amount = parseInt(amountInput);
    if (isNaN(amount) || amount <= 0 || coins.length === 0) return;

    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    const history = [];

    history.push({
      dp: [...dp], i: 0, coin: null, prevI: null,
      message: "Initialization: dp[0] = 0 (0 coins needed for amount 0). Rest = ∞"
    });

    for (let i = 1; i <= amount; i++) {
      for (let c of coins) {
        if (c <= i) {
          const prev = dp[i];
          const proposed = dp[i - c] + 1;
          const updated = proposed < prev;
          if (updated) dp[i] = proposed;

          history.push({
            dp: [...dp], i, coin: c, prevI: i - c, updated,
            message: `i=${i}, coin=${c}  ➡️  min(dp[${i}], dp[${i - c}] + 1) = ${dp[i]}${updated ? ' (Updated!)' : ' (No change)'}`
          });
        } else {
          history.push({
            dp: [...dp], i, coin: c, prevI: null, updated: false,
            message: `i=${i}, coin=${c}  ➡️  Coin ${c} is greater than amount ${i}. Skip.`
          });
        }
      }
    }
    setSteps(history);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Inicializar al cargar el componente
  useEffect(() => {
    generateSteps();
  }, []);

  // Lógica del reproductor automático (Play/Pause)
  useEffect(() => {
    let timer;
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 800); // Velocidad de reproducción (800ms)
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '20px 0', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      <h3 style={{ marginTop: 0, borderBottom: '2px solid #cbd5e1', paddingBottom: '10px' }}>Interactive DP Table Trace</h3>
      
      {/* Controles de Configuración */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9em', fontWeight: 'bold' }}>Coins (comma separated):</label>
          <input type="text" value={coinsInput} onChange={e => setCoinsInput(e.target.value)} style={{ padding: '5px', width: '120px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9em', fontWeight: 'bold' }}>Target Amount:</label>
          <input type="number" value={amountInput} onChange={e => setAmountInput(e.target.value)} style={{ padding: '5px', width: '80px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={generateSteps} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
            Build Table
          </button>
        </div>
      </div>

      {/* Controles de Reproducción */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button onClick={() => { setIsPlaying(false); setCurrentStepIndex(0); }} style={btnStyle}>⏪ Reset</button>
        <button onClick={() => { setIsPlaying(false); setCurrentStepIndex(p => Math.max(0, p - 1)); }} disabled={currentStepIndex === 0} style={btnStyle}>◀️ Step</button>
        <button onClick={() => setIsPlaying(!isPlaying)} style={{...btnStyle, backgroundColor: isPlaying ? '#ef4444' : '#22c55e', color: 'white'}}>
          {isPlaying ? '⏸ Pause' : '▶️ Play'}
        </button>
        <button onClick={() => { setIsPlaying(false); setCurrentStepIndex(p => Math.min(steps.length - 1, p + 1)); }} disabled={currentStepIndex === steps.length - 1} style={btnStyle}>Step ▶️</button>
      </div>

      {/* Mensaje de Estado Actual */}
      <div style={{ backgroundColor: '#e0f2fe', padding: '15px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        {currentStep.message}
      </div>

      {/* Visualización del Array DP */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {currentStep.dp.map((val, index) => {
          const isCurrentI = index === currentStep.i;
          const isPrevI = index === currentStep.prevI;
          const isUpdated = isCurrentI && currentStep.updated;
          
          let bgColor = 'white';
          if (isCurrentI) bgColor = isUpdated ? '#86efac' : '#fef08a'; // Verde si actualiza, Amarillo si comprueba
          else if (isPrevI) bgColor = '#bae6fd'; // Azul para la celda a la que miramos hacia atrás

          return (
            <div key={index} style={{ width: '45px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s' }}>
              <div style={{ fontSize: '0.8em', color: '#64748b', marginBottom: '4px' }}>{index}</div>
              <div style={{
                width: '100%', height: '45px', border: isCurrentI ? '3px solid #f59e0b' : '1px solid #cbd5e1',
                backgroundColor: bgColor, display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontWeight: 'bold', borderRadius: '4px', boxShadow: isCurrentI ? '0 0 8px rgba(245,158,11,0.5)' : 'none'
              }}>
                {val === Infinity ? '∞' : val}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Leyenda */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '0.8em', color: '#475569' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width:'12px', height:'12px', backgroundColor:'#fef08a', border:'2px solid #f59e0b'}}></div> Current `i`</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width:'12px', height:'12px', backgroundColor:'#bae6fd', border:'1px solid #cbd5e1'}}></div> Referenced `dp[i - c]`</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width:'12px', height:'12px', backgroundColor:'#86efac', border:'2px solid #f59e0b'}}></div> Updated Value</span>
      </div>
    </div>
  );
}

const btnStyle = { padding: '8px 15px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', fontWeight: 'bold' };