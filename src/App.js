import { createStackNavigator } from 'react-navigation';
import React from 'react';
import * as Expo from 'expo';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { ApolloProvider } from 'react-apollo';
import { setContext } from 'apollo-link-context';
import {
  signIn, signOut, getToken, loadAssetsAsync,
} from './utils/Utils';
import HomeScreen from './Home';
import RoomListScreen from './RoomList';
import BookingScreen from './Booking';
import Login from './Login';

const { AppLoading } = Expo;

const GRAPHQL_URL = 'https://timeedit.ericwennerberg.se/graphql';
const cache = new InMemoryCache({
  dataIdFromObject: object => object.token || null,
});

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
});


const authLink = setContext(async (req, { headers }) => {
  const token = await getToken();
  if (!token) {
    return { headers };
  }
  console.log(token);
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : null,
    },
  };
});

const link = authLink.concat(httpLink);

const client = new ApolloClient({
  link,
  cache,
});

const AppNavigator = createStackNavigator({
  Home: { screen: HomeScreen },
  RoomList: { screen: RoomListScreen },
  Booking: { screen: BookingScreen },
  Login: { screen: Login },
},
{
  initialRouteName: 'Home',
});

const AppLoginNavigator = createStackNavigator({
  Login: { screen: Login },
  Home: { screen: HomeScreen },
  RoomList: { screen: RoomListScreen },
  Booking: { screen: BookingScreen },
},
{
  initialRouteName: 'Login',
});

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false,
      loaded: false,
    };
  }

  async componentWillMount() {
    const token = await getToken();
    if (token) {
      this.setState({ loggedIn: true });
    }
  }

  componentDidMount() {
    loadAssetsAsync().then(() => this.setState({ loaded: true }));
  }

  handleChangeLoginState = (loggedIn = false, jwt) => {
    this.setState({ loggedIn });
    if (loggedIn) {
      signIn(jwt);
    } else {
      // signOut();
    }
  };

  render() {
    const { loggedIn, loaded } = this.state;
    if (!loaded) {
      return <AppLoading />; // eslint-disable-line
    }
    return (
      <ApolloProvider client={client}>
        {loggedIn
          ? <AppNavigator screenProps={{ changeLoginState: this.handleChangeLoginState }} />
          : <AppLoginNavigator screenProps={{ changeLoginState: this.handleChangeLoginState }} />}
      </ApolloProvider>
    );
  }
}
