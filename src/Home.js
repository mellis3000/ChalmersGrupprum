import React from 'react';
import * as Expo from 'expo';
import {
  Text, View, TouchableOpacity, Image, NetInfo,
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Toast, { DURATION } from 'react-native-easy-toast';
import {
  getLocale, parseIcal,
} from './utils/Utils';
import {
  months, rooms, locations, groupRoomTitle, nowText,
} from './utils/Constants';
import { styles } from './utils/Styles';

const ArrowIcon = require('../res/img/right-arrow.png');

const { AppLoading } = Expo;

const formatDate = (date, language) => `${date.getDate()} ${months[language][date.getMonth()]}`;

const formatTime = (time) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return `${hours > 9 ? hours : (`0${hours}`)}:${minutes > 9 ? minutes : `0${minutes}`}`;
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const getDateWithoutTime = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const setFreeInterval = (events, time, bookings) => {
  if (events) {
    // If time is before all bookings
    if (bookings[0][0] > time) {
      return {
        freeFrom: '00:00',
        freeUntil: formatTime(bookings[0][0]),
      };
    }
    // If time is after all bookings
    if (bookings[bookings.length - 1][1] <= time) {
      return {
        freeFrom: formatTime(bookings[bookings.length - 1][1]),
        freeUntil: '23:59',
      };
    }

    // If time is between two bookings
    for (let i = 0; i < bookings.length; i += 1) {
      if (bookings.length > 1) {
        if (bookings[i][1] <= time && bookings[i + 1][0] > time) {
          return {
            freeFrom: formatTime(bookings[i][1]),
            freeUntil: formatTime(bookings[i + 1][0]),
          };
        }
      }
    }
  }

  return {
    freeFrom: '00:00',
    freeUntil: '23:59',
  };
};

const getEventsByDay = (events, date) => {
  if (events === null) {
    return [];
  }
  const result = events.reduce((arr, e) => {
    const eventDate = new Date(e.getFirstPropertyValue('dtstart'));
    if (getDateWithoutTime(eventDate).valueOf() === getDateWithoutTime(date).valueOf()) {
      arr.push(e);
    }
    return arr;
  }, []);
  return result;
};

const mapEventsByLocation = (events, location) => {
  const roomArr = {};
  for (const room of rooms[location]) {
    roomArr[room] = null;
  }
  if (events === null) {
    return roomArr;
  }
  const mappedEvents = events.reduce((obj, e) => {
    const loc = e.getFirstPropertyValue('location');
    const multiLoc = loc.replace('\\', '');
    const multiArr = multiLoc.split(',').map(str => str.trim());
    for (const room of multiArr) {
      if (obj[room] !== undefined) {
        if (obj[room] === null) {
          obj[room] = [e];
        } else {
          obj[room].push(e);
        }
      }
    }
    return obj;
  }, roomArr);

  return mappedEvents;
};

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      events: null,
      language: 'en',
      location: 1,
      isTimePickerVisible: false,
      isDatePickerVisible: false,
      date: new Date(),
      minDuration: 60,
    };
    this.showDatePicker = this.showDatePicker.bind(this);
    this.hideDatePicker = this.hideDatePicker.bind(this);
    this.showTimePicker = this.showTimePicker.bind(this);
    this.hideTimePicker = this.hideTimePicker.bind(this);
    this.handleDatePicked = this.handleDatePicked.bind(this);
    this.handleTimePicked = this.handleTimePicked.bind(this);
    this.refreshEvents = this.refreshEvents.bind(this);
  }


  componentDidMount() {
    getLocale().then(language => this.setState({ language }));
    this.refreshEvents();
    this.getConnectionStatus();
  }


  getConnectionStatus = () => {
    NetInfo.getConnectionInfo().then((connectionInfo) => {
      if (connectionInfo.type === 'none' || connectionInfo.type === 'unknown') {
        this.toast.show('You are offline.', DURATION.FOREVER);
      }
    });
  };

  setNowText(freeFrom) {
    const { date } = this.state;
    const { language } = this.state;
    const freeFromDate = new Date(date);
    const now = new Date();
    freeFromDate.setHours(parseInt(freeFrom.split(':')[0], 0), parseInt(freeFrom.split(':')[1], 0));
    return (isToday(date) && now >= freeFromDate) ? nowText[language] : freeFrom;
  }

  getAvailableRooms(roomEvents, time) {
    for (const key of Object.keys(roomEvents)) {
      if (roomEvents[key]) {
        const events = roomEvents[key];

        const bookings = [];
        for (const e of events) {
          bookings.push([e.getFirstPropertyValue('dtstart').toJSDate(), e.getFirstPropertyValue('dtend').toJSDate()]);
        }
        bookings.sort();

        for (const booking of bookings) {
          // Remove from list if booked the chosen time
          if (booking[0] <= time && booking[1] > time) {
            delete roomEvents[key];
            break;
          }
          roomEvents[key] = setFreeInterval(roomEvents[key], time, bookings);
        }

        if (roomEvents[key]) {
          if (!this.fulfillsMinimumDuration(roomEvents[key].freeFrom, roomEvents[key].freeUntil)) {
            delete roomEvents[key];
          }
        }
      } else {
        roomEvents[key] = setFreeInterval(roomEvents[key]);
      }
      if (roomEvents[key]) {
        roomEvents[key].freeFrom = this.setNowText(roomEvents[key].freeFrom, time);
      }
    }
    return roomEvents;
  }

  refreshEvents() {
    parseIcal().then((events) => {
      this.setState({ events });
    });
  }

  mapEvents(events) {
    const { date } = this.state;
    const { location } = this.state;

    const dateEvents = getEventsByDay(events, date);
    const mapped = mapEventsByLocation(dateEvents, location);
    this.availableRooms = this.getAvailableRooms(mapped, date);

    return this.availableRooms;
  }

  fulfillsMinimumDuration(start, end) {
    const now = new Date();
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();
    const startTimeInMinutes = parseInt(start.split(':')[0], 0) * 60 + parseInt(start.split(':')[1], 0);
    const endTimeInMinutes = parseInt(end.split(':')[0], 0) * 60 + parseInt(end.split(':')[1], 0);

    const { minDuration } = this.state;

    return nowInMinutes > startTimeInMinutes
      ? (endTimeInMinutes - nowInMinutes) > minDuration
      : (endTimeInMinutes - startTimeInMinutes) > minDuration;
  }


  showTimePicker() { this.setState({ isTimePickerVisible: true }); }

  hideTimePicker() { this.setState({ isTimePickerVisible: false }); }

  handleTimePicked(time) {
    const { date } = this.state;
    date.setHours(time.getHours());
    date.setMinutes(time.getMinutes());
    this.hideTimePicker();
  }

  showDatePicker() {
    this.setState({ isDatePickerVisible: true });
  }

  hideDatePicker() { this.setState({ isDatePickerVisible: false }); }

  handleDatePicked(date) {
    this.setState({ date });
    this.hideDatePicker();
  }

  render() {
    const { navigate } = this.props.navigation; // eslint-disable-line

    const {
      date, location, isDatePickerVisible, isTimePickerVisible, events, language,
    } = this.state;

    if (events === null) {
      return <AppLoading />; // eslint-disable-line
    }
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Chalmers</Text>
          <Text style={styles.headerText}>Grupprum</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => this.setState({ location: 1 })}
            activeOpacity={1}
            style={location === 1 ? styles.buttonActive : styles.buttonInactive}
          >
            <Text style={styles.whiteText}>{locations[0]}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.setState({ location: 2 })}
            activeOpacity={1}
            style={location === 2 ? styles.buttonActive : styles.buttonInactive}
          >
            <Text style={styles.whiteText}>{locations[1]}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <View style={styles.dateText}>
            <TouchableOpacity
              onPress={this.showDatePicker}
              activeOpacity={1}
              style={styles.buttonActive}
            >
              <Text style={styles.whiteText}>{formatDate(date, language).toUpperCase()}</Text>
            </TouchableOpacity>
            <DateTimePicker
              mode="date"
              date={date}
              isVisible={isDatePickerVisible}
              onConfirm={this.handleDatePicked}
              onCancel={this.hideDatePicker}
              datePickerModeAndroid="default"
            />
          </View>
          <TouchableOpacity
            onPress={this.showTimePicker}
            activeOpacity={1}
            style={styles.buttonActive}
          >
            <Text style={styles.whiteText}>{formatTime(date)}</Text>
          </TouchableOpacity>
          <DateTimePicker
            mode="time"
            date={date}
            isVisible={isTimePickerVisible}
            onConfirm={this.handleTimePicked}
            onCancel={this.hideTimePicker}
            datePickerModeAndroid="default"
            locale="sv-SE"
          />
        </View>
        <TouchableOpacity
          onPress={() => navigate('RoomList', {
            refresh: this.refreshEvents, events: this.mapEvents(events), language, date,
          })}
          style={styles.searchButton}
        >
          <Text style={styles.searchButtonText}>{groupRoomTitle[language]}</Text>
          <Image
            source={ArrowIcon}
            style={styles.bookingIcon}
          />
        </TouchableOpacity>
        <Toast
          ref={(c) => { this.toast = c; }} // eslint-disable-line
          style={{ backgroundColor: 'black', borderRadius: 10 }}
          position="bottom"
          positionValue={200}
          fadeInDuration={200}
          opacity={0.8}
          textStyle={{ color: 'white', fontSize: 16 }}
        />
      </View>
    );
  }
}


export default HomeScreen;
