import { createStackNavigator } from 'react-navigation';
import HomeScreen from './Home';
import RoomListScreen from './RoomList.js';
import BookingScreen from './Booking.js';

const App = createStackNavigator({
  Home: { screen: HomeScreen },
  RoomList: { screen: RoomListScreen },
  Booking: { screen: BookingScreen },
},
{
  initialRouteName: 'Home',
});

export default App;
