import React from 'react';
import ICAL from 'ical.js';
import moment from 'moment';
import RoomList from './RoomList.js';

import { StyleSheet, Text, View, Button } from 'react-native';
import { createStackNavigator } from 'react-navigation';


async function getDataFromUrlAsync() {
  try {
    let response = await fetch('https://se.timeedit.net/web/chalmers/db1/public/ri663Q42Y88Z55Q5Y480X265y5Z756Y613Y4371Q547146XX7855538655411XY63745658X3Y5Y816X4368458X7465175357X16Y57156Y5336438X563Y5774Y4133557X15Y16X5366X67558334Y13Y346XX557196374Y515453X75613364351673X231YY5X7544X475398Y614537154Y4656X11Y345X35XY5317757444Y2165X3519865438XY614950X36336446XY76620Y7815Y1X5506839069931YY56X4019X39576366YX51606136501X9Y095995YX636Y3X6100916651X86396161Y009165Y66Y9595X05X63310415Y0921X55366Y6X15103Y6114553XY14X1036X61512Y0935511451674169XY4385Y1194X6X56Y90435565033Y563501196YX7586YX633120526Y0X6151X4830165286X81260Y32Y5661303X83X08Y2276581Y057X686063256Y813Y6361Y502108XX6256932356011XY83205864X3Y6Y118X0372061X6085125355X18Y62168Y5776032X583Y6920Y0173752X15Y18X5387X82661730Y17Y308XX652158320Y615058X26814880766823X331YY6X2508X025370Y817632150Y7853X81Y386X35XY6312260800Y8185X7512566036XY516250X32356605XY05260Y5616Y1X5506632962631YY55X8016X32535356YX51206136501X6Y061225YX536Y3X0500214655X40326151Y062565Y60Y2567X05X63320010Y0011X55356Y2X96103Y5150563XY20X1032X62528Y00356517C1dF56Z0t5037FY6Q9E752583n5BE00QZ0903Q2t6Q8Z9C6EC680BDCF6A6B50B.ics');
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
  static navigationOptions = {
    title: 'Welcome',
  };

  constructor(props) {
    super(props);
    this.state = {
      events: []
    };
  }

  componentWillMount() {
    let res = parseIcal()
      .then(events => {
        this.setState({
          events
        })
      });
  }

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
    Rooms.forEach(room => {
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
            freeFrom: '00:00',
            freeUntil: this.setTimeFormat(bookings[i][0])
          };
        } else if(bookings[i][1] <= time) {
          events = {
            freeFrom: this.setTimeFormat(bookings[i][1]),
            freeUntil: '24:00'
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

  render() {
    const { events } = this.state;
    const { navigate } = this.props.navigation;
    const dateEvents = this.getEventsByDay(events, new Date('2018-05-31'));

    const mapped = this.mapEventsByLocation(dateEvents);
   // const availableRooms = this.getAvailableRooms(mapped, new Date('June 13, 2018 08:00:00'));
    const availableRooms = this.getAvailableRooms(mapped, new Date());

    return (
      <View style={styles.container}>
      <Button
          onPress={() => navigate('Table', {events: availableRooms})}
          title="Visa Lediga Grupprum"
          color="#009fff"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const Rooms = ['1198','EG-2515', 'EG-2516','EG-3217','EG-3503', 'EG-3504','EG-3505','EG-3506','EG-3507','EG-3508','EG-4205','EG-4207','EG-5205','EG-5207','EG-5209','EG-5211','EG-5213','EG-5215','EG-6205','EG-6207','EG-6209','EG-6211','EG-6213','EG-6215','F4051','F4052','F4053','F4054','F4055','F4056','F4057','F4058','F4113','F4114','F4115','F7024','KG31','KG32','KG33','KG34','KG35','KG51','KG52','KG53','KG54','M1203A','M1203B','M1203C','M1203D','M1203E','M1204','M1205','M1206A','M1206B','M1208A','M1208C','M1211','M1212A','M1212B','M1212C','M1212D','M1212E','M1212F','M1213A','M1213B','M1215A','M1215B','M1215C','M1215D','M1222A','M1222B','SB-G065','SB-G301','SB-G302','SB-G303','SB-G304','SB-G305','SB-G306','SB-G310','SB-G311','SB-G312','SB-G313','SB-G502','SB-G503','SB-G505','SB-G506','SB-G510','SB-G511','SB-G512','SB-G513','SB-G514'];

const HomeScreen = createStackNavigator({
  Home: { screen: App },
  Table: { screen: RoomList },
},
{
  initialRouteName: 'Home',
});

export default HomeScreen;



