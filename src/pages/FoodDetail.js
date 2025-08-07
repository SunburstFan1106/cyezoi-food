import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFoodDetail } from '../services/api';
import RatingSystem from '../components/RatingSystem';

const FoodDetail = () => {
    const { id } = useParams();
    const [food, setFood] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFoodDetail = async () => {
            try {
                const data = await getFoodDetail(id);
                setFood(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFoodDetail();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="food-detail">
            <h1>{food.name}</h1>
            <img src={food.image} alt={food.name} />
            <p>{food.description}</p>
            <RatingSystem foodId={food.id} />
            <h2>User Reviews</h2>
            <ul>
                {food.reviews.map((review) => (
                    <li key={review.id}>
                        <strong>{review.user}</strong>: {review.comment} (Rating: {review.rating})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FoodDetail;