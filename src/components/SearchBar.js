import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (event) => {
        event.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSearch}>
            <input
                type="text"
                placeholder="搜索美食..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">搜索</button>
        </form>
    );
};

export default SearchBar;