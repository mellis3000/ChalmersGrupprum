import React, { Component } from 'react';
import {
  SectionList, Text, View, Image, TouchableOpacity,
} from 'react-native';
import AsPure from '../as-pure';
import { noRooms, timeHeader, groupRooms } from './utils/Constants';
import { styles } from './utils/Styles';

const ArrowIcon = require('../res/img/right-arrow.png');

const getSections = (events) => {
  const result = [];
  for (const key of Object.keys(events)) {
    const obj = {
      title: groupRooms[key],
      data: events[key].sort(),
    };
    result.push(obj);
  }
  return result;
};

const sortEvents = events => Object.keys(events).reduce((obj, e) => {
  let firstLetter = e.substring(0, 1) === 'F' ? e.substring(0, 1) : e.substring(0, 2);
  const titleString = `${e.replace(' ', '')} ${events[e].freeFrom} - ${events[e].freeUntil}`;
  if (firstLetter === '11') {
    firstLetter = 'KG';
  }
  if (!obj[firstLetter]) {
    obj[firstLetter] = [titleString];
  } else {
    obj[firstLetter].push(titleString);
  }
  return obj;
}, {});

class RoomListScreen extends Component {
  render() {
    const { navigation } = this.props; // eslint-disable-line
    const { navigate } = navigation;
    const {
      events, language, date, refresh,
    } = navigation.state.params;
    const sortedEvents = sortEvents(events);
    if (Object.keys(events).length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.noRoomsHeader}>{noRooms[language]}</Text>
        </View>
      );
    }
    return (
      <View style={styles.roomListcontainer}>
        <SectionList
          sections={getSections(sortedEvents)}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigate('Booking', {
              refresh, item, language, date,
            })}
            >
              <ListItem item={item} />
            </TouchableOpacity>)}
          renderSectionHeader={({ section }) => (
            <View style={styles.headers}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <Text style={[styles.sectionHeader, styles.sectionHeaderIsFree]}>
                {timeHeader[language]}
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          keyExtractor={(item, index) => index}
        />
      </View>
    );
  }
}


const ListItem = AsPure(({ item }) => (
  <View style={styles.item}>
    <Text style={styles.roomText}>{item.split(' ')[0]}</Text>
    <View style={styles.time}>
      <Text style={styles.timeText}>{`${item.split(' ')[1]} ${item.split(' ')[2]} ${item.split(' ')[3]}`}</Text>
    </View>
    <View style={styles.bookingButton}>
      <Image
        source={ArrowIcon}
        style={styles.bookingIcon}
      />
    </View>
  </View>));


export default RoomListScreen;
