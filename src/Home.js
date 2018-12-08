import React from 'react';
import * as Expo from 'expo';
import {
  StyleSheet, Text, View, TouchableOpacity, Image,
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { getLocale, parseIcal, loadAssetsAsync } from './utils/Utils';

const ArrowIcon = require('../res/img/right-arrow.png');

const { AppLoading } = Expo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#3ea8f9',
    borderWidth: 2,
    padding: 10,
    margin: 15,
    borderRadius: 20,
    flexDirection: 'row',
  },
  buttonActive: {
    alignItems: 'center',
    backgroundColor: '#3ea8f9',
    padding: 10,
    margin: 15,
    borderRadius: 20,
  },
  buttonInactive: {
    alignItems: 'center',
    backgroundColor: '#a7d6f9',
    padding: 10,
    margin: 15,
    borderRadius: 20,
  },
  searchButtonText: {
    fontSize: 16,
    marginRight: 5,
    color: '#3ea8f9',
    fontFamily: 'latoBold',
  },
  headerText: {
    fontSize: 40,
    color: '#3ea8f9',
    fontFamily: 'montBold',
  },
  text: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'latoBold',
  },
  blueText: {
    fontSize: 16,
    color: '#3ea8f9',
    fontFamily: 'latoBold',
    alignSelf: 'center',
  },
  dateText: {
    minWidth: 135,
  },
  picker: {
    width: 170,
    height: 100,
    backgroundColor: '#3ea8f9',
  },
  datePicker: {
    backgroundColor: '#3ea8f9',
  },
  bookingIcon: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
  },

});

const rooms = {
  1: ['1198', 'EG-2515', 'EG-2516', 'EG-3217', 'EG-3503', 'EG-3504', 'EG-3505', 'EG-3506', 'EG-3507', 'EG-3508', 'EG-4205', 'EG-4207', 'EG-5205', 'EG-5207', 'EG-5209', 'EG-5211', 'EG-5213', 'EG-5215', 'EG-6205', 'EG-6207', 'EG-6209', 'EG-6211', 'EG-6213', 'EG-6215', 'F4051', 'F4052', 'F4053', 'F4054', 'F4055', 'F4056', 'F4057', 'F4058', 'F4113', 'F4114', 'F4115', 'F7024', 'KG31', 'KG32', 'KG33', 'KG34', 'KG35', 'KG51', 'KG52', 'KG53', 'KG54', 'M1203A', 'M1203B', 'M1203C', 'M1203D', 'M1203E', 'M1204', 'M1205', 'M1206A', 'M1206B', 'M1208A', 'M1208C', 'M1211', 'M1212A', 'M1212B', 'M1212C', 'M1212D', 'M1212E', 'M1212F', 'M1213A', 'M1213B', 'M1215A', 'M1215B', 'M1215C', 'M1215D', 'M1222A', 'M1222B', 'SB-G065', 'SB-G301', 'SB-G302', 'SB-G303', 'SB-G304', 'SB-G305', 'SB-G306', 'SB-G310', 'SB-G311', 'SB-G312', 'SB-G313', 'SB-G502', 'SB-G503', 'SB-G505', 'SB-G506', 'SB-G510', 'SB-G511', 'SB-G512', 'SB-G513'],
  2: ['Jupiter123', 'Jupiter144', 'Jupiter146', 'Jupiter147', 'Svea 218', 'Svea 238', 'Svea227', 'Svea229A', 'Svea229B', 'Svea229C'],
};

const months = {
  sv: ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const locations = ['JOHANNEBERG', 'LINDHOLMEN'];

const groupRoomTitle = {
  sv: 'VISA LEDIGA GRUPPRUM',
  en: 'SHOW AVAILABLE ROOMS',
};

const nowText = {
  sv: 'Nu',
  en: 'Now',
};

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
      language: 'en',
      loaded: false,
      events: null,
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
  }

  componentDidMount() {
    parseIcal().then((events) => {
      this.setState({ events });
      this.mapEvents();
    });
    getLocale().then(language => this.setState({ language: language.substring(0, 2) }));
    loadAssetsAsync().then(() => this.setState({ loaded: true }));
  }

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

  mapEvents() {
    console.log('map events');
    const { events } = this.state;
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
    const { loaded } = this.state;
    const { events } = this.state;
    const { date } = this.state;
    const { location } = this.state;
    const { language } = this.state;
    const { isDatePickerVisible } = this.state;
    const { isTimePickerVisible } = this.state;
    const { navigate } = this.props.navigation; // eslint-disable-line

    if (!loaded || events === null) {
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
            <Text style={styles.text}>{locations[0]}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.setState({ location: 2 })}
            activeOpacity={1}
            style={location === 2 ? styles.buttonActive : styles.buttonInactive}
          >
            <Text style={styles.text}>{locations[1]}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <View style={styles.dateText}>
            <TouchableOpacity
              onPress={this.showDatePicker}
              activeOpacity={1}
              style={styles.buttonActive}
            >
              <Text style={styles.text}>{formatDate(date, language).toUpperCase()}</Text>
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
            <Text style={styles.text}>{formatTime(date)}</Text>
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
        <TouchableOpacity onPress={() => navigate('RoomList', { events: this.mapEvents(), language })} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>{groupRoomTitle[language]}</Text>
          <Image
            source={ArrowIcon}
            style={styles.bookingIcon}
          />
        </TouchableOpacity>
      </View>
    );
  }
}


export default HomeScreen;
