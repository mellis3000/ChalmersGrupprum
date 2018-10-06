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
    let response = await fetch('https://cloud.timeedit.net/chalmers/web/public/ri663Q40Y88Z55Q5Y484X765y5Z854Y613Y7361Q547146XX2755238555411XY63745657X3Y5Y816X4378458X7465175386X16Y58156Y5366438X563Y5674Y4133557X15Y15X5366X67557334Y13Y346XX557186374Y515453X75612364359673X131YY5X7544X475387Y613537154Y4656X91Y345X35XY5317357444Y1165X3519765438XY614950X36326446XY36620Y7815Y1X5506839069931YY56X4019X39576366YX51606136501X9Y095995YX636Y3X6100916651X86396161Y009165Y66Y9595X05X63310415Y0921X55366Y6X15103Y6114553XY14X1036X61512Y0935511451674169XY4385Y1194X6X56Y90435565033Y563501196YX7586YX633120526Y0X6151X4830165286X81260Y32Y5661303X83X08Y2276581Y057X686063256Y813Y6361Y502108XX6256932356011XY83205864X3Y6Y118X0372061X6085125355X18Y62168Y5776032X583Y6920Y0173752X15Y18X5387X82661730Y17Y308XX652158320Y615058X26814880766823X331YY6X2508X025370Y817632150Y7853X81Y386X35XY6312260800Y8185X7512566036XY516250X32306605XY55260Y5616Y1X5506632962631YY55X8016X32535356YX51206136501X6Y061225YX536Y3X0500210655X40326151Y072665Y50Y2564X05X63320210Y0091X55356Y2X86103Y5150563XY20X1032X61520Y0035551451529669XY4326Y1150X1X58Y93035515938Y563641158YX3560YX533184515Y4X0155X963415516QX61154Y31Y500137776Ft24310Q3BZZ7E08937d5942Z6130t9791Q3BQn9178D04B889.ics');  
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
      events: [],
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
    const { events } = this.state;
    const { navigate } = this.props.navigation;

    const dateEvents = this.getEventsByDay(events, this.state.date);

    const mapped = this.mapEventsByLocation(dateEvents);
    const availableRooms = this.getAvailableRooms(mapped, this.state.date);


    Text.defaultProps.style = { fontFamily: 'latoBlack' }
    if (!this.state.loaded) {
      return <AppLoading />;
    }

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
  1: ['1198','EG-2515', 'EG-2516','EG-3217','EG-3503', 'EG-3504','EG-3505','EG-3506','EG-3507','EG-3508','EG-4205','EG-4207','EG-5205','EG-5207','EG-5209','EG-5211','EG-5213','EG-5215','EG-6205','EG-6207','EG-6209','EG-6211','EG-6213','EG-6215','F4051','F4052','F4053','F4054','F4055','F4056','F4057','F4058','F4113','F4114','F4115','F7024','KG31','KG32','KG33','KG34','KG35','KG51','KG52','KG53','KG54','M1203A','M1203B','M1203C','M1203D','M1203E','M1204','M1205','M1206A','M1206B','M1208A','M1208C','M1211','M1212A','M1212B','M1212C','M1212D','M1212E','M1212F','M1213A','M1213B','M1215A','M1215B','M1215C','M1215D','M1222A','M1222B','SB-G065','SB-G301','SB-G302','SB-G303','SB-G304','SB-G305','SB-G306','SB-G310','SB-G311','SB-G312','SB-G313','SB-G502','SB-G503','SB-G505','SB-G506','SB-G510','SB-G511','SB-G512','SB-G513','SB-G514'],
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



