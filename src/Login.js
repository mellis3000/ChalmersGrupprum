import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';
import { styles } from './utils/Styles';
import { PrimaryColor } from '../res/values/Styles';

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      username: '',
      usernameError: false,
      passwordError: false,
      loading: false,
    };
  }

  async onLogin() {
    const { username, password } = this.state;
    const { login, screenProps } = this.props;

    if (username.length === 0) {
      return this.setState({ usernameError: true });
    }
    this.setState({ usernameError: false });

    if (password.length === 0) {
      return this.setState({ passwordError: true });
    }

    this.setState({ passwordError: false });

    const { data } = await login(username, password);

    screenProps.changeLoginState(true, data.login.token);

    return data;
  }

  render() {
    const { usernameError, passwordError, loading } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Chalmers</Text>
          <Text style={styles.headerText}>Grupprum</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputs}
            placeholder="CID"
            keyboardType="default"
            underlineColorAndroid="transparent"
            onChangeText={usernameInput => this.setState({ username: usernameInput })}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputs}
            placeholder="Password"
            secureTextEntry
            underlineColorAndroid="transparent"
            onChangeText={passwordInput => this.setState({ password: passwordInput })}
          />
        </View>
        <TouchableHighlight
          style={[styles.buttonContainer, styles.loginButton]}
          onPress={() => this.onLogin()}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableHighlight>
        <Text style={styles.errorText}>{(usernameError || passwordError) ? 'Invalid username or password' : ''}</Text>
        {loading
    && (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={PrimaryColor} />
    </View>
    )
}
      </View>
    );
  }
}

export default graphql(
  gql`
    mutation login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        token
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      login: (username, password) => mutate({ variables: { username, password } }),
    }),
  },
)(Login);
