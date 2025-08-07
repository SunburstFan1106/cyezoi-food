import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import RatingSystem from '../components/RatingSystem';
import './AddReview.css';

const AddReview = ({ foodId }) => {
    const [review, setReview] = useState('');
    const [rating, setRating] = useState(0);
    const history = useHistory();

    const handleReviewChange = (e) => {
        setReview(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ foodId, review, rating }),
        });

        if (response.ok) {
            history.push(`/food/${foodId}`);
        } else {
            // Handle error
            alert('Failed to submit review');
        }
    };

    return (
        <div className="add-review">
            <h2>Add a Review</h2>
            <form onSubmit={handleSubmit}>
                <RatingSystem rating={rating} setRating={setRating} />
                <textarea
                    value={review}
                    onChange={handleReviewChange}
                    placeholder="Write your review here..."
                    required
                />
                <button type="submit">Submit Review</button>
            </form>
        </div>
    );
};

export default AddReview;