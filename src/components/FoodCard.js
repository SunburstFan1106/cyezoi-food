import React from 'react';
import RatingSystem from './RatingSystem';
import './FoodCard.css'; // Assuming you have a CSS file for styling

const FoodCard = ({ foodItem }) => {
    return (
        <div className="food-card">
            <h3>{foodItem.name}</h3>
            <p>{foodItem.description}</p>
            <img src={foodItem.image} alt={foodItem.name} />
            <RatingSystem rating={foodItem.rating} />
        </div>
    );
};

export default FoodCard;