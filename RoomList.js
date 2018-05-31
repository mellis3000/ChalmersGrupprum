import React, { Component } from 'react';

import ICAL from 'ical.js';
import { SectionList, StyleSheet, Text, View } from 'react-native';

export default class RoomList extends Component {




  getSections(events){
    const groupRooms = {
      F: "Fysikhuset",
      M: "Maskinhuset",
      E: "EDIT-huset",
      K: "Kemihuset",
      S: "SB-huset",
      1: "Blabla"
    }
    let result = [];
    Object.keys(events).forEach(key => {
      console.log(events[key]);
      let obj = {
        title: groupRooms[key],
        data: events[key].sort()
      }
      result.push(obj);
    });
    return result;
  }


  render() {
    const { events } = this.props.navigation.state.params;

    const sortedEvents = Object.keys(events).reduce((obj,e) => {
      const firstLetter = e.substring(0,1);
      console.log(e)
      const titleString = e + " " + events[e]['freeFrom'] + " - " + events[e]['freeUntil'];
      !obj[firstLetter] ? obj[firstLetter] = [titleString] : obj[firstLetter].push(titleString);
      return obj;
    },{});

    return (
      <View style={styles.container}>
        <SectionList
          sections={this.getSections(sortedEvents)}
          renderItem={({item}) => <Text style={styles.item}>{item}</Text>}
          renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          keyExtractor={(item, index) => index}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   paddingTop: 22
  },
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(247,247,247,1.0)',
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
})