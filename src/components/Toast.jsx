import React from 'react';

export default function Toast({ show, msg, type }) {
  return (
    <div className={`toast ${show ? 'show' : ''} ${type}`}>
      {msg}
    </div>
  );
}
