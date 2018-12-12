import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
} from 'react-native';
import { PrimaryColor, White, LightGrey } from '../res/values/Styles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: White,
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 50,
  },
  inputContainer: {
    borderColor: LightGrey,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    width: 250,
    height: 45,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputs: {
    height: 45,
    marginLeft: 16,
    borderBottomColor: '#FFFFFF',
    flex: 1,
  },
  inputIcon: {
    width: 30,
    height: 30,
    marginLeft: 15,
    justifyContent: 'center',
  },
  buttonContainer: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: 250,
    borderRadius: 30,
  },
  loginButton: {
    backgroundColor: PrimaryColor,
  },
  headerText: {
    fontSize: 40,
    color: PrimaryColor,
    fontFamily: 'montBold',
  },
  loginText: {
    color: White,
  },
  errorText: {
    color: 'red',
  },
});

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

    const { data } = await login(username, password);

    screenProps.changeLoginState(true, data.login.token);

    return data;
  }

  render() {
    const { usernameError, passwordError } = this.state;
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
