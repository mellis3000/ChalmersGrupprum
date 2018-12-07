import React from 'react';
import * as Expo from 'expo';
import { StyleSheet, Text, View, TouchableOpacity, Image} from 'react-native';
import { getLocale, parseIcal, loadAssetsAsync } from './utils/Utils.js';
import DateTimePicker from 'react-native-modal-datetime-picker';

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
        isDurationPickerVisible: false,
        date: new Date(),
        duration: 1,
        minTime: 60,
      }
    }
  
    componentDidMount() {
      parseIcal().then(events => this.setState({ events }) ); 
      getLocale().then(language => this.setState({ language: language.substring(0, 2) }));   
      loadAssetsAsync().then(res =>  this.setState({ loaded: true }));
    }
  
    getEventsByDay(events, date) {
      const result = events.reduce((arr, e) => {
        const eventDate = new Date(e.getFirstPropertyValue('dtstart'));
        if (this.getDateWithoutTime(eventDate).valueOf() === this.getDateWithoutTime(date).valueOf()) {
          arr.push(e);
        }
        return arr;
      }, []);
      return result;
    }
  
    mapEventsByLocation(events) {
      let roomArr = {};
      for (const room of Rooms[this.state.location]) {
        roomArr[room] = null;
      };
      
      const mappedEvents = events.reduce((obj,e) => {
        const loc = e.getFirstPropertyValue('location');
        let multiLoc = loc.replace('\\', '');
        let multiArr = multiLoc.split(',').map(str => str.trim());
        for (const location of multiArr) {
          if (obj[location] !== undefined) {
            if (obj[location] === null) {
              obj[location] = [e]
            } else {
              obj[location].push(e);
            }
          }
        }
        return obj;
      }, roomArr);
  
      return mappedEvents;
    }
  
    getAvailableRooms(roomEvents, time) {
      for (const key of Object.keys(roomEvents)) {
        if(roomEvents[key]){
          const events = roomEvents[key];
          let bookings = [];
          for (const e of events) {
            bookings.push([e.getFirstPropertyValue('dtstart').toJSDate(), e.getFirstPropertyValue('dtend').toJSDate()]);
          };
          bookings.sort();
  
          for(const booking of bookings) {
            //Remove from list if booked the chosen time
            if (booking[0] <=  time && booking[1] > time){ 
              delete roomEvents[key];
              break;
            } 
            roomEvents[key] = this.setFreeInterval(roomEvents[key], time, bookings);
          }
  
          if (roomEvents[key]) {
            if (!this.fulfillsMinimumTime(roomEvents[key].freeFrom, roomEvents[key].freeUntil)){
              delete roomEvents[key];
            }
          }
        } else {
          roomEvents[key] = this.setFreeInterval(roomEvents[key]);
        }
        if (roomEvents[key])
          roomEvents[key].freeFrom = this.setNowText(roomEvents[key].freeFrom, time)
      };
      return roomEvents;
    }
  
    fulfillsMinimumTime(start, end) {
       const now = new Date();
       const nowInMinutes = now.getHours() * 60 + now.getMinutes();
       const startTimeInMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
       const endTimeInMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
       
       return nowInMinutes > startTimeInMinutes
          ? (endTimeInMinutes - nowInMinutes) > this.state.minTime
          : (endTimeInMinutes - startTimeInMinutes) > this.state.minTime
    }
  
    setFreeInterval(events, time, bookings) {
      if(events) {
        //If time is before all bookings
        if(bookings[0][0] > time) {
            return {
              freeFrom: '00:00',
              freeUntil: this.formatTime(bookings[0][0])
            };
        } 
        // If time is after all bookings
        else if(bookings[bookings.length-1][1] <= time) {
          return {
            freeFrom: this.formatTime(bookings[bookings.length-1][1]),
            freeUntil: '23:59'
          };
        }
  
        //If time is between two bookings
        for(let i = 0; i < bookings.length; i++) {
          if (bookings.length > 1) {
            if(bookings[i][1] <= time && bookings[i+1][0] > time) {  
              return {
                freeFrom: this.formatTime(bookings[i][1]),
                freeUntil: this.formatTime(bookings[i+1][0])
              };
            }
          }
        }
      }
  
      return {
        freeFrom: '00:00',
        freeUntil: '23:59'
      };
    }
  
    _showTimePicker = () => this.setState({ isTimePickerVisible: true });
   
    _hideTimePicker = () => this.setState({ isTimePickerVisible: false });
   
    _handleTimePicked = (time) => {
      this.state.date.setHours(time.getHours())
      this.state.date.setMinutes(time.getMinutes())
      this._hideTimePicker();
    };
  
    _showDatePicker = () => this.setState({ isDatePickerVisible: true });
   
    _hideDatePicker = () => this.setState({ isDatePickerVisible: false });
   
    _handleDatePicked = (date) => {
      this.setState({ date: date });
      this._hideDatePicker();
    };
  
    _showDurationPicker = () => this.setState({ isDurationPickerVisible: true });
  
    formatDate(date){
      return date.getDate() + " " + Months[this.state.language][date.getMonth()];
    }
  
    formatTime(time) {
      const hours = time.getHours();
      const minutes = time.getMinutes();
      return `${hours > 9 ? hours : ('0'+hours)}:${minutes > 9 ? minutes : '0'+minutes}` 
    }
  
    setNowText(freeFrom) {
      let freeFromDate = new Date(this.state.date);
      let now = new Date();
      freeFromDate.setHours(parseInt(freeFrom.split(':')[0]), parseInt(freeFrom.split(':')[1]));
      return (this.isToday(this.state.date) && now >= freeFromDate) ? nowText[this.state.language] : freeFrom;
    }
  
    isToday(date) {
      let today = new Date();
      return date.toDateString() == today.toDateString()
    }

    getDateWithoutTime = (date) => {
      let d = new Date(date);
    	d.setHours(0, 0, 0, 0);
      return d;
    }
  
    render() {
      if (!this.state.loaded || this.state.events === null) {
        return <Expo.AppLoading />;
      }
      
      const { events } = this.state;
      const { navigate } = this.props.navigation;
  
      const dateEvents = this.getEventsByDay(events, this.state.date);
  
      const mapped = this.mapEventsByLocation(dateEvents);
  
      const availableRooms = this.getAvailableRooms(mapped, this.state.date);
  
      return (
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Chalmers</Text>
            <Text style={styles.headerText}>Grupprum</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => this.setState({ location: 1 })} activeOpacity={1} style={this.state.location === 1 ? styles.buttonActive :  styles.buttonInactive}>
              <Text style={styles.text}>{Locations[0]}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.setState({ location: 2 })} activeOpacity={1} style={this.state.location === 2 ? styles.buttonActive :  styles.buttonInactive}>
              <Text style={styles.text}>{Locations[1]}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <View style={styles.dateText}>
            <TouchableOpacity onPress={this._showDatePicker} activeOpacity={1} style={styles.buttonActive}>
              <Text style={styles.text}>{this.formatDate(this.state.date).toUpperCase()}</Text>
              </TouchableOpacity>
              <DateTimePicker
                mode='date'
                date={this.state.date}
                isVisible={this.state.isDatePickerVisible}
                onConfirm={this._handleDatePicked}
                onCancel={this._hideDatePicker}
                datePickerModeAndroid={'default'}
              />
            </View>
            <TouchableOpacity onPress={this._showTimePicker} activeOpacity={1} style={styles.buttonActive}>
              <Text style={styles.text}>{this.formatTime(this.state.date)}</Text>
            </TouchableOpacity>
            <DateTimePicker
              mode='time'
              date={this.state.date}
              isVisible={this.state.isTimePickerVisible}
              onConfirm={this._handleTimePicked}
              onCancel={this._hideTimePicker}
              datePickerModeAndroid={'default'}
              locale='sv-SE'
            />
          </View>
          <TouchableOpacity onPress={() => navigate('RoomList', {events: availableRooms, language: this.state.language})} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>{groupRoomTitle[this.state.language]}</Text>
            <Image
                  source={require('../res/img/right-arrow.png')}
                  style={styles.bookingIcon}
              />
          </TouchableOpacity>
          </View>
      );
    }
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'space-evenly',
    },
    buttonContainer: { 
      flexDirection: 'row'
    },
    headerContainer: { 
      flexDirection: 'column',
      alignItems: "center",
      justifyContent: "center",
      height: 120
    },
    searchButton: {
      alignItems: 'center',
      backgroundColor: '#fff',
      borderColor: '#3ea8f9',
      borderWidth: 2,
      padding: 10,
      margin: 15,
      borderRadius: 20,
      flexDirection: "row"
    },
    buttonActive: {
      alignItems: 'center',
      backgroundColor: '#3ea8f9',
      padding: 10,
      margin: 15,
      borderRadius: 20
    },
    buttonInactive: {
      alignItems: 'center',
      backgroundColor: '#a7d6f9',
      padding: 10,
      margin: 15,
      borderRadius: 20    
    },
    searchButtonText: {
      fontSize: 16,
      marginRight: 5,
      color: '#3ea8f9',
      fontFamily: 'latoBold'
    },
    headerText: {
      fontSize: 40,
      color: '#3ea8f9',
      fontFamily: 'montBold'
    },
    text: {
      fontSize: 16,
      color: '#fff',
      fontFamily: 'latoBold'
    },
    blueText: {
      fontSize: 16,
      color: '#3ea8f9',
      fontFamily: 'latoBold',
      alignSelf: "center"
    },
    dateText: {
      minWidth: 135
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
  
  const Rooms = {
    1: ['1198','EG-2515', 'EG-2516','EG-3217','EG-3503', 'EG-3504','EG-3505','EG-3506','EG-3507','EG-3508','EG-4205','EG-4207','EG-5205','EG-5207','EG-5209','EG-5211','EG-5213','EG-5215','EG-6205','EG-6207','EG-6209','EG-6211','EG-6213','EG-6215','F4051','F4052','F4053','F4054','F4055','F4056','F4057','F4058','F4113','F4114','F4115','F7024','KG31','KG32','KG33','KG34','KG35','KG51','KG52','KG53','KG54','M1203A','M1203B','M1203C','M1203D','M1203E','M1204','M1205','M1206A','M1206B','M1208A','M1208C','M1211','M1212A','M1212B','M1212C','M1212D','M1212E','M1212F','M1213A','M1213B','M1215A','M1215B','M1215C','M1215D','M1222A','M1222B','SB-G065','SB-G301','SB-G302','SB-G303','SB-G304','SB-G305','SB-G306','SB-G310','SB-G311','SB-G312','SB-G313','SB-G502','SB-G503','SB-G505','SB-G506','SB-G510','SB-G511','SB-G512','SB-G513'],
    2: ['Jupiter123', 'Jupiter144', 'Jupiter146', 'Jupiter147', 'Svea 218', 'Svea 238', 'Svea227', 'Svea229A', 'Svea229B', 'Svea229C'],
    }
  
  const Months = {
    sv: ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  }
  
  const Locations = ['JOHANNEBERG', 'LINDHOLMEN'];
  
  const groupRoomTitle = {
    sv: "VISA LEDIGA GRUPPRUM",
    en: "SHOW AVAILABLE ROOMS",
  }
  
  const nowText = {
    sv: "Nu",
    en: "Now"
	}
	
	export default HomeScreen;