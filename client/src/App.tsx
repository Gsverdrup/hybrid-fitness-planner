import { useEffect } from 'react';

function App() {
  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then(res => res.json())
      .then(console.log);
  }, []);

  return <h1>Hybrid Fitness Planner</h1>;
}

export default App;
