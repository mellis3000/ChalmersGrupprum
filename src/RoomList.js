import React, { Component } from 'react';
import {
  SectionList, StyleSheet, Text, View, Image, TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-easy-toast';
import AsPure from '../as-pure';
import {
  White, LightGrey,
} from '../res/values/Styles';


const ArrowIcon = require('../res/img/right-arrow.png');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: White,
    justifyContent: 'center',
  },
  headers: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: LightGrey,
    borderBottomWidth: 0.5,
  },
  sectionHeader: {
    fontSize: 16,
    flexGrow: 1,
    fontWeight: 'bold',
    fontFamily: 'latoBold',
    marginLeft: 10,
  },
  sectionHeaderIsFree: {
    flexGrow: 0,
    width: 200,
    marginLeft: 0,
  },
  item: {
    flexDirection: 'row',
    borderColor: LightGrey,
    borderBottomWidth: 0.5,
  },
  roomText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'latoLight',
    paddingTop: 15,
    paddingBottom: 15,
    marginLeft: 10,
  },
  time: {
    flexGrow: 0,
    width: 160,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 15,
    paddingBottom: 15,
  },
  bookingButton: {
    width: 40,
    flexGrow: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingIcon: {
    height: 25,
    width: 25,
    resizeMode: 'contain',
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'latoLight',
    width: 95,
    justifyContent: 'space-between',
  },
  noRoomsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'latoBold',
    alignSelf: 'center',
  },
});

const groupRooms = {
  F: 'FYSIK',
  M1: 'MASKIN',
  EG: 'EDIT',
  KG: 'KEMI',
  SB: 'SB',
  Sv: 'SVEA',
  Ju: 'JUPITER',
};

const timeHeader = {
  sv: 'LEDIGT',
  en: 'AVAILABLE',
};

const noRooms = {
  sv: 'INGA LEDIGA GRUPPRUM',
  en: 'NO AVAILABLE ROOMS',
};

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
      <View style={styles.container}>
        <Toast
          ref="toast" // eslint-disable-line
          style={{ backgroundColor: 'black', borderRadius: 10 }}
          position="bottom"
          positionValue={200}
          fadeInDuration={200}
          opacity={0.8}
          textStyle={{ color: 'white', fontSize: 16 }}
        />
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
