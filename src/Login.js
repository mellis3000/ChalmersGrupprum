import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableHighlight,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { styles } from './utils/Styles';

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      username: '',
      usernameError: false,
      passwordError: false,
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

    try {
      const { data } = await login(username, password);
      screenProps.changeLoginState(true, data.login.token);
      return data;
    } catch (error) {
      console.log(error);
      this.setState({ passwordError: true });
      return false;
    }
  }

  render() {
    const { usernameError, passwordError } = this.state;
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.loginContainer}>
          <View style={[{ marginBottom: 50 }, styles.headerContainer]}>
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
          <View style={{ height: 80 }}>
            <TouchableHighlight
              style={styles.loginButton}
              onPress={() => this.onLogin()}
            >
              <Text style={styles.loginText}>Login</Text>
            </TouchableHighlight>
            <Text style={styles.errorText}>{(usernameError || passwordError) ? 'Invalid username or password' : ''}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
