import React from 'react';
import ICAL from 'ical.js';
import moment from 'moment';
import RoomList from './RoomList.js';

import { StyleSheet, Text, View, Button } from 'react-native';
import { createStackNavigator } from 'react-navigation';


async function getDataFromUrlAsync() {
  try {
    let response = await fetch('https://se.timeedit.net/web/chalmers/db1/public/ri663Q40Y88Z55Q5Y484X765y5Z854Y613Y7361Q547146XX2755238555411XY63745657X3Y5Y816X4378458X7465175386X16Y58156Y5365438X563Y5674Y4133657X15Y15X5366X67557334Y13Y346XX557186374Y515453X75612364359673X131YY5X7544X475387Y613537154Y4656X91Y345X35XY5317357444Y1165X3519765438XY614950X36326446XY36620Y7815Y1X5506839069931YY56X4019X39576366YX51606136501X9Y095995YX636Y3X6100916651X86396161Y009165Y66Y9595X05X63310415Y4921X55365Y6X15103Y6164553XY64X1036X61513Y9935611451674160XY0385Y1190X1X56Y95435165032Y513601128YX6586YX633130526Y0X6152X0830165286X81260Y32Y5761304X83X09Y2266581Y058X686663256Y813Y7361Y502108XX6256532356011XY83205865X3Y6Y118X0371062X2085175364X18Y62168Y5777032X583Y6120Y0173852X15Y19X5387X82665830Y17Y308XX652168320Y615058X26812780763823X431YY6X2508X025387Y818630150Y6852X81Y376X35XY6312065800Y0135X8512566036XY516250X32356605XY65270Y5616Y1X5506632162631YY55X9016X32545356YX51306136501X6Y062225YX536Y3X0500210655X60326101Y072665Y50Y2554X05X63320210Y0091X55356Y2X86103Y5150563XY2071032X61520Y0035Q51Q6Z11776n5079A930A26tQ80630DC6Z6640t59dZE4E2Q8C67BA1D.ics');
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

  getEventsByDay(events, date){
    let result = events.reduce((arr, e) => {
      let eventDate = new Date(e.getFirstPropertyValue('dtstart'));
      eventDate.setUTCHours(0,0,0,0);
      if (eventDate.toString() === date.toString()) arr.push(e);
      return arr;
    }, []);
    return result;
  }

  render() {
    const { events } = this.state;
    const { navigate } = this.props.navigation;
    const dateEvents = this.getEventsByDay(events,new Date('2018-05-30'));
    return (
      <View style={styles.container}>
      <Button
          onPress={() => navigate('Table', {events: dateEvents})}
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

const HomeScreen = createStackNavigator({
  Home: { screen: App },
  Table: { screen: RoomList },
},
{
  initialRouteName: 'Home',
});

export default HomeScreen;



