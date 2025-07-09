import { useRef, useState } from 'react';
import BitfieldsCanvas from './BitfieldsCanvas.jsx';
import Stats from './Stats.jsx';
import Controls from './Controls.jsx';

export default function AppRoot() {
  const engineRef = useRef(null);   // holds the Three engine instance
  const [engine, setEngine] = useState(null);

  return (
    <>
      <BitfieldsCanvas apiRef={engineRef} onReady={setEngine} />

      {/* overlay UI */}
      <div style={ui.wrapper}>
        <Stats engine={engine} />
        <Controls engine={engine} />
      </div>
    </>
  );
}

const ui = {
  wrapper: {
    position: 'fixed',
    top: 12,
    right: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 10,
    userSelect: 'none',
    gap: '12px',
  }
};
