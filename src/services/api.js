import axios from 'axios';

const API_URL = 'https://api.example.com/food'; // 替换为实际的API URL

export const fetchFoodItems = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching food items:', error);
        throw error;
    }
};

export const fetchFoodDetail = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching food detail:', error);
        throw error;
    }
};

export const submitReview = async (foodId, reviewData) => {
    try {
        const response = await axios.post(`${API_URL}/${foodId}/reviews`, reviewData);
        return response.data;
    } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
    }
};