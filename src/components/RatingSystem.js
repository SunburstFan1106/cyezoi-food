import React, { useState } from 'react';

const RatingSystem = ({ onRating }) => {
    const [rating, setRating] = useState(0);

    const handleRating = (value) => {
        setRating(value);
        onRating(value);
    };

    return (
        <div className="rating-system">
            <h3>Rate this Food</h3>
            <div className="stars">
                {[1, 2, 3, 4, 5].map((value) => (
                    <span
                        key={value}
                        className={`star ${value <= rating ? 'filled' : ''}`}
                        onClick={() => handleRating(value)}
                    >
                        ★
                    </span>
                ))}
            </div>
            <p>Your rating: {rating}</p>
        </div>
    );
};

export default RatingSystem;