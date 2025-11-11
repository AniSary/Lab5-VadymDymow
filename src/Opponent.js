import React from 'react';

export default function Opponent({ name = 'Enemy', strength, stamina, image, isDead }) {
  return (
    <div className="opponent">
      {image && (
        <img src={image} alt={name} className="opponent-image" />
      )}
      <div className="opponent-info">
        <h3>{name}</h3>
        <p>Strength: {strength}</p>
        <p>Stamina: {stamina > 0 ? stamina : 0} {isDead ? '(dead)' : ''}</p>
      </div>
    </div>
  );
}
