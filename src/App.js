import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AddMenu from './pages/AddMenu';
// ...其他页面

function App() {
    return (
        <Router>
            <Switch>
                {/* ...其他路由 */}
                <Route path="/add-menu" component={AddMenu} />
            </Switch>
        </Router>
    );
}

export default App;