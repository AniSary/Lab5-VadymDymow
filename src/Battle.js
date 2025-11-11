import React, { useState } from 'react';
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

  function round() {
    if (finished) return;

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
    } else if (newEnemyStamina <= 0) {
      setLog((l) => [`You win!`, ...l].slice(0, 10));
      setFinished(true);
    } else if (newPlayerStamina <= 0) {
      setLog((l) => [`You are dead. Game over.`, ...l].slice(0, 10));
      setFinished(true);
    }
  }

  function reset() {
    setPlayer({ strength: 5, stamina: 20 });
    setEnemy({ name: 'Goblin', strength: 4, stamina: 15 });
    setLog([]);
    setFinished(false);
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
