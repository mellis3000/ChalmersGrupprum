import HomeScreen from './Home.js';
import RoomListScreen from './RoomList.js';
import BookingScreen from './Booking.js';
import { createStackNavigator } from 'react-navigation';

export default App = createStackNavigator({
  Home: { screen: HomeScreen },
  RoomList: { screen: RoomListScreen },
  Booking: { screen: BookingScreen }
},
  {
    initialRouteName: 'Home',
  });
