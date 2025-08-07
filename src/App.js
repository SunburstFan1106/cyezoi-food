import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import FoodDetail from './pages/FoodDetail';
import AddReview from './pages/AddReview';
import './styles/main.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/food/:id" component={FoodDetail} />
                    <Route path="/add-review" component={AddReview} />
                </Switch>
            </div>
        </Router>
    );
}

export default App;