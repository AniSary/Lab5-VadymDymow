import React, { useState, useEffect, useRef } from 'react';
import Opponent from './Opponent';

function randDie() {
  return Math.floor(Math.random() * 6) + 1;
}

export default function Battle() {
  // initial parameters
  const [player, setPlayer] = useState({ strength: 5, stamina: 20 });
  const [enemy, setEnemy] = useState({ name: 'Goblin', strength: 4, stamina: 15 });
  const [log, setLog] = useState([]);
  const [finished, setFinished] = useState(false);
  const wsRef = useRef(null);

  function closeWs() {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) { }
      wsRef.current = null;
    }
  }

  // Fetch initial enemy from local server (if available)
  useEffect(() => {
    let mounted = true;
    const url = 'http://127.0.0.1:4000/return-monster';
    if (typeof window !== 'undefined' && window.fetch) {
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return;
          const name = data.race ? data.race.charAt(0).toUpperCase() + data.race.slice(1) : 'Enemy';
          setEnemy({ name, strength: data.strength ?? 4, stamina: data.stamina ?? 15 });
          setLog((l) => [`Fetched enemy: ${name} (str ${data.strength}, sta ${data.stamina})`, ...l].slice(0,10));
        })
        .catch((e) => {
          // ignore failures (server might not be running)
          setLog((l) => [`Could not fetch enemy from server: ${e.message}`, ...l].slice(0,10));
        });
    } else {
      // fetch not available in this environment (tests) — skip
    }

    return () => { mounted = false; };
  }, []);

  function round() {
    if (finished) return;
    // ensure websocket connection is established (to receive random events)
    if (typeof window !== 'undefined' && !wsRef.current) {
      try {
        const ws = new WebSocket('ws://127.0.0.1:4001');
        wsRef.current = ws;
        ws.addEventListener('open', () => {
          setLog((l) => ['Connected to event server', ...l].slice(0,10));
        });
        ws.addEventListener('message', (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.type === 'welcome') {
              setLog((l) => [`Server: ${data.msg}`, ...l].slice(0,10));
            } else if (data.type === 'buff') {
              // apply only while both alive
              setPlayer((p) => {
                setEnemy((e) => {
                  const stillAlive = (p.stamina > 0) && (e.stamina > 0);
                  if (!stillAlive) return e;
                  const target = data.target;
                  const attr = data.attribute;
                  const amount = Number(data.amount) || 0;
                  if (target === 'player') {
                    const newP = { ...p };
                    newP[attr] = (newP[attr] || 0) + amount;
                    setLog((l) => [`Server event: ${attr}+${amount} to you`, ...l].slice(0,10));
                    return e; // enemy unchanged in this setEnemy call
                  } else {
                    const newE = { ...e };
                    newE[attr] = (newE[attr] || 0) + amount;
                    setLog((l) => [`Server event: ${attr}+${amount} to ${newE.name}`, ...l].slice(0,10));
                    return newE;
                  }
                });
                return p;
              });
            }
          } catch (err) {
            // ignore malformed messages
          }
        });
        ws.addEventListener('close', () => {
          setLog((l) => ['Event server disconnected', ...l].slice(0,10));
          wsRef.current = null;
        });
      } catch (err) {
        setLog((l) => [`Could not connect to event server: ${err.message}`, ...l].slice(0,10));
      }
    }
    // player's hit to enemy
    const pHit = Math.floor((randDie() - 0.5) * player.strength);
    // enemy's hit to player
    const eHit = Math.floor((randDie() - 0.5) * enemy.strength);

    const newEnemyStamina = enemy.stamina - Math.max(pHit, 0);
    const newPlayerStamina = player.stamina - Math.max(eHit, 0);

    setEnemy((prev) => ({ ...prev, stamina: newEnemyStamina }));
    setPlayer((prev) => ({ ...prev, stamina: newPlayerStamina }));

    const entry = `You hit the ${enemy.name} for ${Math.max(pHit,0)} dmg. It hits you for ${Math.max(eHit,0)} dmg.`;
    setLog((l) => [entry, ...l].slice(0, 10));

    if (newEnemyStamina <= 0 && newPlayerStamina <= 0) {
      setLog((l) => [`Both died... It's a draw.`, ...l].slice(0, 10));
      setFinished(true);
      closeWs();
    } else if (newEnemyStamina <= 0) {
      setLog((l) => [`You win!`, ...l].slice(0, 10));
      setFinished(true);
      closeWs();
    } else if (newPlayerStamina <= 0) {
      setLog((l) => [`You are dead. Game over.`, ...l].slice(0, 10));
      setFinished(true);
      closeWs();
    }
  }

  function reset() {
    setPlayer({ strength: 5, stamina: 20 });
    setEnemy({ name: 'Goblin', strength: 4, stamina: 15 });
    setLog([]);
    setFinished(false);
    closeWs();
  }

  return (
    <div className="battle">
      <h2>Battle Arena</h2>

      <div className="combatants">
        <div className="player">
          <h3>You</h3>
          <p>Strength: {player.strength}</p>
          <p>Stamina: {player.stamina > 0 ? player.stamina : 0}</p>
        </div>

        <Opponent
          name={enemy.name}
          strength={enemy.strength}
          stamina={enemy.stamina}
          isDead={enemy.stamina <= 0}
          image={'/logo192.png'}
        />
      </div>

      <div className="controls">
        <button onClick={round} disabled={finished}>Strike</button>
        <button onClick={reset}>Reset</button>
      </div>

      <div className="log">
        <h4>Battle log</h4>
        <ul>
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
