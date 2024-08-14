import React, { useState } from 'react';

const Question = ({ question, onAnswer }) => {
    const [answer, setAnswer] = useState('');

    const handleSubmit = () => {
        onAnswer(answer);
    };

    return (
        <div>
            <h3>{question.text}</h3>
            <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
            />
            <button onClick={handleSubmit}>Submit Answer</button>
        </div>
    );
};

export default Question;
