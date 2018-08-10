import React, { Component } from 'react';
import AsPure from './as-pure';
import { SectionList, StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';

class RoomList extends Component {

  getSections(events) {
    const groupRooms = {
      F: "FYSIKHUSET",
      M1: "MASKINHUSET",
      EG: "EDIT-HUSET",
      KG: "KEMIHUSET",
      SB: "SB-HUSET",
      Sv: "SVEA",
      Ju: "JUPITER"
    }
    let result = [];
    Object.keys(events).forEach(key => {
      let obj = {
        title: groupRooms[key],
        data: events[key].sort()
      }
      result.push(obj);
    });
    return result;
  }

  sortEvents(events) {
    return Object.keys(events).reduce((obj,e) => {
      let firstLetter = e.substring(0,1) === 'F' ? e.substring(0,1) : e.substring(0,2);
      const titleString = e.replace(' ','') + " " + events[e].freeFrom + " - " + events[e].freeUntil;
      if (firstLetter === '11')
        firstLetter = "KG";
      !obj[firstLetter] ? obj[firstLetter] = [titleString] : obj[firstLetter].push(titleString);
      return obj;
    },{});
  }

  render() {
    const { events } = this.props.navigation.state.params;
    const sortedEvents = this.sortEvents(events);

    return (
      <View style={styles.container}>
        <SectionList
          sections={this.getSections(sortedEvents)}
          renderItem={({item}) => <ListItem item={item}/>}
          renderSectionHeader={({section}) => 
          <View style={styles.headers}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <Text style={styles.sectionHeader}>LEDIGT</Text>
          </View>}
          keyExtractor={(item, index) => index}
        />
      </View>
    );
  }
}

const redirectToBooking = () => {

}

const ListItem = AsPure(({item}) => {

  return (
  <TouchableOpacity style={styles.item}>
    <Text style={styles.roomText}>{item.split(' ')[0]}</Text>
    <View style={styles.time}>
    <Text style={styles.timeText}>{`${item.split(' ')[1]} ${item.split(' ')[2]} ${item.split(' ')[3]}`}</Text>
    </View>
    <View style={styles.bookingButton}>
      <Image
          source={require('./res/img/right-arrow.png')}
          style={styles.bookingIcon}
      />
    </View>
  </TouchableOpacity>);
})

const styles = StyleSheet.create({
  container: {
   flex: 1,
   paddingTop: 22,
   backgroundColor: '#fff',
  },
  headers: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: '30%',
    marginLeft: 5
  },
  sectionHeader: {
    padding: 10,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'latoBold',
    backgroundColor: '#fff'
  },
  item: {
    paddingLeft: 10,
    flexDirection: 'row',
    borderColor: '#e0e2e5',
    borderWidth: 0.5,
    justifyContent: 'flex-end'
  },
  roomText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'latoLight',
    paddingTop: 15,
    paddingBottom: 15,
    marginLeft: 5,
  },
  time: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 15,
    paddingBottom: 15,
  },
  bookingButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: 10
  },
  bookingIcon: {
    height: 25,
    width: 25,
    resizeMode: 'contain',
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'latoLight',
  }
})

export default RoomList;