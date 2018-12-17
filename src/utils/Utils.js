import ICAL from 'ical.js';
import * as Expo from 'expo';
import { AsyncStorage } from 'react-native';
import { URL } from './Constants';

export const getDataFromUrlAsync = async () => {
  try {
    const response = await fetch(URL, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0,
      },
    });
    const responseString = await response.text();
    return responseString;
  } catch (error) {
    console.error(error);
  }
};

export const getLocale = async () => {
  if (Expo.Localization.locale === 'sv-SE') {
    return 'sv';
  }
  return 'en';
};

export const parseIcal = async () => {
  const result = await getDataFromUrlAsync();
  const jcalData = ICAL.parse(result);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');
  return vevents;
};

export const loadAssetsAsync = async () => Expo.Font.loadAsync({
  latoBold: require('../../res/assets/fonts/LatoBlack.ttf'),
  latoLight: require('../../res/assets/fonts/LatoLight.ttf'),
  montLight: require('../../res/assets/fonts/MontLight.otf'),
  montBold: require('../../res/assets/fonts/MontBold.otf'),
});

const AUTH_TOKEN = 'AUTH_TOKEN';

let token;

export const getToken = async () => {
  if (token) {
    return Promise.resolve(token);
  }
  token = await AsyncStorage.getItem(AUTH_TOKEN);
  return token;
};

export const signIn = (newToken) => {
  token = newToken;
  return AsyncStorage.setItem(AUTH_TOKEN, newToken);
};

export const signOut = () => {
  token = undefined;
  return AsyncStorage.removeItem(AUTH_TOKEN);
};
