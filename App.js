import React from 'react';
import ICAL from 'ical.js';
import { AppLoading, Font } from 'expo';
import RoomList from './RoomList.js';
import { StyleSheet, Text, View, TouchableOpacity, Platform , NativeModules} from 'react-native';
import { createStackNavigator } from 'react-navigation';
import DateTimePicker from 'react-native-modal-datetime-picker';
import BookingWebView from './BookingWebView.js';
import { DangerZone } from 'expo';
const { Localization } = DangerZone;

getDataFromUrlAsync = async () => {
  try {
    let response = await fetch('https://cloud.timeedit.net/chalmers/web/public/ri663Q40Y88Z55Q5Y484X765y5Z854Y613Y7361Q547146XX2755238555411XY63745657X3Y5Y816X4378458X7465175386X16Y58156Y5366438X563Y5674Y4133557X15Y15X5366X67557334Y13Y346XX557186374Y515453X75612364359673X131YY5X75445454367YXY35851417465XX61Y943X1557W3Y733541576YX4594YX533130576Y4X8152X3634165666X91750Y36Y5841302X93X06Y6686591Y055X996463659Y913Y0391Y506109XX9656736856011XY93905965X3Y6Y619X0316066X1095115360X11Y69156Y5664435X513Y6164Y5113150X11Y12X5366XX9W510200Y4941X55365Y6X85103Y6174553XY64X1036X63510Y9935511051661889XY4326Y6120X7X58Y23035465235Y663601128YX6587YX633160526Y0X6150X8830165286X81260Y32Y5661307X83X04Y2166581Y055X286963152Y813Y3361Y502108XX72565366735Y1X2X371783859Y622YXX18061W6500X51077885YX236Y3X2800813658X12386121Y058765Y72Y8576X05X63380412Y0201X55386Y8X76123Y7180563XY80X1038X62588Y2235681051660220XY0356Y6150X7X52Y56035765538Y633601152YX65X6YX633195556Y0X6168X22301W5623X21560Y355506Y2115X4512566035XY016250X32336600XY40270Y5516Y1X5506632262531YY50X0015X32580306YX51906136501X5Y051225YX035Y3X5144613551X89386191Y096265Y39Y6512X45X53380515Y4181X55305Y6X75113Y0104553XY64X1436X55569Y11355010Z1Q66Z2973435dYQZ05X1F56Y07Qt5955n313660C7Q109Ft092ED76E57A29B698B42A9419A.ics');  
    let responseString = await response.text();
    return responseString;
  } catch (error) {
    console.error(error);
  }
}

getLocale = async () => {
  return await Localization.getCurrentLocaleAsync();
}

parseIcal = async () => {
  let result = await getDataFromUrlAsync();
  jcalData = ICAL.parse(result);
  comp = new ICAL.Component(jcalData);
  vevents = comp.getAllSubcomponents("vevent");
  return vevents;
}

loadAssetsAsync = async () => {
  return await Expo.Font.loadAsync({
    latoBold: require('./res/assets/fonts/LatoBlack.ttf'),
    latoLight: require('./res/assets/fonts/LatoLight.ttf'),
  });
};

const getDateWithoutTime = (date) => {
  let d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

class App extends React.Component {

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
      if (getDateWithoutTime(eventDate).valueOf() === getDateWithoutTime(date).valueOf()) 
        arr.push(e);
        
      return arr;
    }, []);
    return result;
  }

  mapEventsByLocation(events) {
    let roomArr = {};
    Rooms[this.state.location].forEach(room => {
      roomArr[room] = null;
    });
    
    const mappedEvents = events.reduce((obj,e) => {

      const loc = e.getFirstPropertyValue('location');
      let multiLoc = loc.replace('\\', '');
      let multiArr = multiLoc.split(',').map(str => str.trim());
      for (const location of multiArr) {
        if (obj[location] !== undefined)
          obj[location] === null ? obj[location] = [e] : obj[location].push(e);
      }
      return obj;
    }, roomArr);

    return mappedEvents;
  }

  getAvailableRooms(roomEvents, time) {
    Object.keys(roomEvents).forEach(key => {
      if(roomEvents[key]){
        const events = roomEvents[key];
        let bookings = [];
        events.forEach(e => {
          bookings.push([e.getFirstPropertyValue('dtstart').toJSDate(), e.getFirstPropertyValue('dtend').toJSDate()]);
        });
        bookings.sort();

        for(const booking of bookings) {
          //Remove from list if booked the chosen time
          if (booking[0] <=  time && booking[1] > time){ 
            delete roomEvents[key];
            break;
          }
          roomEvents[key] = this.setFreeInterval(roomEvents[key], time, bookings);
        }
      } else {
        roomEvents[key] = this.setFreeInterval(roomEvents[key]);
      }
    });
    return roomEvents;
  }

  setTimeFormat(time) {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return `${hours > 9 ? hours : ('0'+hours)}:${minutes > 9 ? minutes : '0'+minutes}` 
  }

  setFreeInterval(events, time, bookings) {
    if(events) {
      //If time is before all bookings
      if(bookings[0][0] > time) {
          return {
            freeFrom: '00:00',
            freeUntil: this.setTimeFormat(bookings[0][0])
          };
      } 
      // If time is after all bookings
      else if(bookings[bookings.length-1][1] <= time) {
        return {
          freeFrom: this.setTimeFormat(bookings[bookings.length-1][1]),
          freeUntil: '24:00'
        };
      }

      //If time is between two bookings
      for(let i = 0; i < bookings.length; i++) {
        if (bookings.length > 1) {
          if(bookings[i][1] <= time && bookings[i+1][0] > time) {  
            return {
              freeFrom: this.setTimeFormat(bookings[i][1]),
              freeUntil: this.setTimeFormat(bookings[i+1][0])
            };
          }
        }
      }
    }

    return {
      freeFrom: '00:00',
      freeUntil: '24:00'
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

  formatDate(date){
    return date.getDate() + " " + Months[this.state.language][date.getMonth()];
  }

  formatTime(time){
     return (time.getHours() < 10 ? '0' + time.getHours() : time.getHours()) + ':' + (time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes())
  }

  render() {
    if (!this.state.loaded || this.state.events === null) {
      return <AppLoading />;
    }
    
    const { events } = this.state;
    const { navigate } = this.props.navigation;

    const dateEvents = this.getEventsByDay(events, this.state.date);

    const mapped = this.mapEventsByLocation(dateEvents);
    const availableRooms = this.getAvailableRooms(mapped, this.state.date);


    return (
      <View style={styles.container}>
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
        />
      </View>
      <TouchableOpacity onPress={() => navigate('Table', {events: availableRooms, language: this.state.language})} style={styles.buttonActive}>
        <Text style={styles.text}>{groupRoomTitle[this.state.language]}</Text>
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
  text: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'latoBold'
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
  }
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

const HomeScreen = createStackNavigator({
  Home: { screen: App },
  Table: { screen: RoomList },
  BookingWeb: { screen: BookingWebView }
},
{
  initialRouteName: 'Home',
});


export default HomeScreen;



