import React from 'react';
import ICAL from 'ical.js';
import { AppLoading, Font } from 'expo';
import RoomList from './RoomList.js';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from 'react-navigation';
import DateTimePicker from 'react-native-modal-datetime-picker';


async function getDataFromUrlAsync() {
  try {
    let response = await fetch('https://se.timeedit.net/web/chalmers/db1/public/ri663Q40Y88Z55Q5Y484X765y5Z854Y613Y7361Q547146XX7855538655411XY63745658X3Y5Y816X4368458X7465175357X16Y57156Y5336438X563Y5774Y4133557X15Y16X5366X67558334Y13Y346XX557196374Y515453X75613364351673X231YY5X7544X475398Y614537154Y4656X11Y345X35XY5317757444Y2165X4519666438XY614950X36336806XY26930Y7815Y1X5506939569931YY56X0019X39586366YX51706136501X9Y096995YX636Y3X5100914651X06315161Y059665Y16Y9516X05X63364819Y4911X55315Y6X25193Y1164553XY64X1436X59561Y9935511051661119XY4325Y1194X6X56Y03435415032Y663501196YX6581YX533100505Y0X7158X1134165266X61964Y39Y5671305X83X00Y2266581Y054X786263256Y813Y3361Y502108XX6256631756011XY83605869X3Y6Y218X0322062X6085165338X18Y61168Y5725032X583Y6620Y0173452X15Y15X5386X82667730Y18Y308XX652188320Y615057X26815780769823X131YY6X2507X025343Y818632150Y8858X21Y376X35XY6312662700Y0185X0512266036XY018350X38376805XY85880Y2716Y1X5506632662631YY55X5016X32595356YX51806136501X6Y067225YX536Y3X5600214656X15326151Y022665Y55Y2563X05X63320610Y0041X55356Y2X06103Y5150563XY20X1032X67522Y0035661051629220XY0386Y5150X5X58Y03035555031Y623601158YX3560YX533174515Y4X0155X963415516QX61154Y31Y500137876BtB1340Q3CZZ0C00C7Ed5516Z6D94t1725Q32Qn3A6F5C12ACAD.ics');
    let responseString = await response.text();
    return responseString;
  } catch (error) {
    console.error(error);
  }
}

async function parseIcal(){
  let result = await getDataFromUrlAsync();
  jcalData = ICAL.parse(result);
  comp = new ICAL.Component(jcalData);
  vevents = comp.getAllSubcomponents("vevent");
  return vevents;
}


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      events: [],
      location: 1,
      isTimePickerVisible: false,
      isDatePickerVisible: false,
      date: new Date(),
      time: new Date(),
    }
  }

  componentDidMount() {
    let res = parseIcal()
      .then(events => {
        this.setState({
          events
        })
      });
  }

  componentWillMount() {
    this._loadAssetsAsync();
  }

  _loadAssetsAsync = async () => {
    await Expo.Font.loadAsync({
      latoBold: require('./res/assets/fonts/LatoBlack.ttf'),
      latoLight: require('./res/assets/fonts/LatoLight.ttf'),
    });
    this.setState({ loaded: true });
  };

  getEventsByDay(events, date) {
    const result = events.reduce((arr, e) => {
      const eventDate = new Date(e.getFirstPropertyValue('dtstart'));
      eventDate.setUTCHours(0,0,0,0);
      if (eventDate.toString() === date.toString()) arr.push(e);
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
      !obj[loc] ? obj[loc] = [e] : obj[loc].push(e);
      return obj;
    },roomArr);

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
          roomEvents[key] = this.setFreeInterval(roomEvents[key], time, bookings, key);
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

  setFreeInterval(events, time, bookings, key) {
    if(events) {
      for(let i = 0; i < bookings.length; i++) {
        if(bookings[i][0] > time) {
          events = {
            freeFrom: i > 0 ? this.setTimeFormat(bookings[i-1][1]) : '00:00',
            freeUntil: this.setTimeFormat(bookings[i][0])
          };
        } else if(bookings[i][1] <= time) {
          events = {
            freeFrom: this.setTimeFormat(bookings[i][1]),
            freeUntil: i < bookings.length - 1 ? this.setTimeFormat(bookings[i+1][0]) : '24:00'
          };
        } else if(bookings[i][1] <= time && bookings[i+1][0] > time) {        
          events = {
            freeFrom: this.setTimeFormat(bookings[i][1]),
            freeUntil: this.setTimeFormat(bookings[i+1][0])
          };
        }
      }
    } else {
      events = {
        freeFrom: '00:00',
        freeUntil: '24:00'
      };
    }
    return events;
  }

  _showTimePicker = () => this.setState({ isTimePickerVisible: true });
 
  _hideTimePicker = () => this.setState({ isTimePickerVisible: false });
 
  _handleTimePicked = (time) => {
    this.setState({ time: time });
    this._hideTimePicker();
  };

  _showDatePicker = () => this.setState({ isDatePickerVisible: true });
 
  _hideDatePicker = () => this.setState({ isDatePickerVisible: false });
 
  _handleDatePicked = (date) => {
    console.log(date)
    date.setHours(this.state.time.getHours(), this.state.time.getMinutes())
    console.log(date)
    this.setState({ date: date });
    this._hideDatePicker();
  };

  formatDate(date){
    return date.getDate() + " " + Months[date.getMonth()];
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
          <Text style={styles.text}>JOHANNEBERG</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.setState({ location: 2 })} activeOpacity={1} style={this.state.location === 2 ? styles.buttonActive :  styles.buttonInactive}>
          <Text style={styles.text}>LINDHOLMEN</Text>
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
            style="@style/DialogTheme"
          />
        </View>
      <TouchableOpacity onPress={this._showTimePicker} activeOpacity={1} style={styles.buttonActive}>
         <Text style={styles.text}>{this.formatTime(this.state.time)}</Text>
        </TouchableOpacity>
        <DateTimePicker
          mode='time'
          date={this.state.time}
          isVisible={this.state.isTimePickerVisible}
          onConfirm={this._handleTimePicked}
          onCancel={this._hideTimePicker}
          datePickerModeAndroid={'default'}
          style="@style/DialogTheme"
        />
      </View>
      <TouchableOpacity onPress={() => navigate('Table', {events: availableRooms})} style={styles.buttonActive}>
        <Text style={styles.text}>VISA LEDIGA GRUPPRUM</Text>
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

const Months = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
const HomeScreen = createStackNavigator({
  Home: { screen: App },
  Table: { screen: RoomList },
},
{
  initialRouteName: 'Home',
});

export default HomeScreen;



