import React, { useState, useEffect } from 'react';
import FoodCard from '../components/FoodCard';
import SearchBar from '../components/SearchBar';
import { fetchFoodItems } from '../services/api';
import './Home.css';

const Home = () => {
    const [foodItems, setFoodItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const getFoodItems = async () => {
            const items = await fetchFoodItems();
            setFoodItems(items);
        };
        getFoodItems();
    }, []);

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const filteredFoodItems = foodItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="home">
            <h1>周边美食评分</h1>
            <SearchBar onSearch={handleSearch} />
            <div className="food-list">
                {filteredFoodItems.map(item => (
                    <FoodCard key={item.id} foodItem={item} />
                ))}
            </div>
        </div>
    );
};

export default Home;