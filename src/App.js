import { createStackNavigator } from 'react-navigation';
import HomeScreen from './Home';
import RoomListScreen from './RoomList';
import BookingScreen from './BookingWebView';

const App = createStackNavigator({
  Home: { screen: HomeScreen },
  RoomList: { screen: RoomListScreen },
  Booking: { screen: BookingScreen },
},
{
  initialRouteName: 'Home',
});

export default App;
