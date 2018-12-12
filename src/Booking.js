import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import {
  StyleSheet, Text, View, TouchableOpacity,
} from 'react-native';
import MultiSlider from 'react-native-multi-slider-cloneable';
import {
  PrimaryColor, SecondaryColor, DarkGrey, White,
} from '../res/values/Styles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: White,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  searchButtonActive: {
    alignItems: 'center',
    backgroundColor: White,
    borderColor: PrimaryColor,
    borderWidth: 2,
    padding: 10,
    margin: 15,
    borderRadius: 20,
    flexDirection: 'row',
  },
  searchButtonInActive: {
    alignItems: 'center',
    backgroundColor: White,
    borderColor: SecondaryColor,
    borderWidth: 2,
    padding: 10,
    margin: 15,
    borderRadius: 20,
    flexDirection: 'row',
  },
  headerText: {
    fontSize: 40,
    color: PrimaryColor,
    fontFamily: 'montBold',
  },
  inactiveText: {
    fontSize: 16,
    color: SecondaryColor,
    fontFamily: 'latoBold',
    alignSelf: 'center',
  },
  activeText: {
    fontSize: 16,
    color: PrimaryColor,
    fontFamily: 'latoBold',
    alignSelf: 'center',
  },
  text: {
    fontSize: 16,
    color: DarkGrey,
    alignSelf: 'flex-start',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    fontFamily: 'montBold',
  },
  successText: {
    fontSize: 20,
    color: PrimaryColor,
    fontFamily: 'montBold',
  },
});

const bookingTitle = {
  sv: 'BOKA RUM',
  en: 'BOOK ROOM',
};

const convertMinutesToTimestamp = (min) => {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${hours > 9 ? hours : (`0${hours}`)}:${minutes > 9 ? minutes : `0${minutes}`}`;
};

const convertTimestamptoMinutes = time => parseInt(time.split(':')[0], 0) * 60 + parseInt(time.split(':')[1], 0);


const getDateString = (date) => {
  const newDate = new Date(date);
  return `${newDate.getFullYear()}${newDate.getMonth() + 1}${newDate.getDate()}`;
};


class BookingScreen extends React.PureComponent {
  constructor(props) {
    super(props);

    const { navigation } = this.props; // eslint-disable-line
    const { language, date, item } = navigation.state.params;

    this.state = {
      language,
      date: new Date(date),
      room: item.split(' ')[0],
      startTimeInMin: item.split(' ')[1] === 'Nu' || item.split(' ')[1] === 'Now' || item.split(' ')[1] === '00:00'
        ? convertTimestamptoMinutes('07:00') : convertTimestamptoMinutes(item.split(' ')[1]),
      endTimeInMin: item.split(' ')[3] === '23:59' ? convertTimestamptoMinutes('18:00') : convertTimestamptoMinutes(item.split(' ')[3]),
      multiSliderValue: [480, 1020],
      bookingButtonDisabled: false,
      responseMessage: '',
      successfullyBooked: false,
    };
  }

  componentDidMount() {
    const { startTimeInMin } = this.state;
    this.setState({ multiSliderValue: [startTimeInMin, startTimeInMin + 240] });
  }

  multiSliderValuesChange = (values) => {
    this.setState({
      multiSliderValue: values,
    });
    this.setState({
      bookingButtonDisabled: values[1] - values[0] > 240,
    });
  };

  async makeBooking() {
    const {
      date, room, multiSliderValue,
    } = this.state;
    const { book } = this.props;

    const booking = {
      roomName: room,
      date: getDateString(date),
      from: convertMinutesToTimestamp(multiSliderValue[0]),
      to: convertMinutesToTimestamp(multiSliderValue[1]),
    };

    const { error } = await book(booking.roomName, booking.date, booking.from, booking.to);

    if (error) {
      this.setState({ responseMessage: error });
    } else {
      this.setState({
        successfullyBooked: true,
        bookingButtonDisabled: true,
      });
    }
  }

  render() {
    const {
      room, language, multiSliderValue, startTimeInMin, endTimeInMin, bookingButtonDisabled, responseMessage, successfullyBooked,
    } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{room}</Text>
        </View>
        <View style={{ width: '80%', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.text}>{convertMinutesToTimestamp(multiSliderValue[0])}</Text>
          <Text style={styles.text}>{convertMinutesToTimestamp(multiSliderValue[1])}</Text>
        </View>
        <MultiSlider
          values={[
            multiSliderValue[0],
            multiSliderValue[1],
          ]}
          selectedStyle={{
            backgroundColor: PrimaryColor,
          }}
          unselectedStyle={{
            backgroundColor: 'silver',
          }}
          containerStyle={{
            width: '80%',
          }}
          touchDimensions={{
            height: 100,
            width: 100,
            borderRadius: 30,
            slipDisplacement: 40,
          }}
          markerStyle={{
            height: 30,
            width: 30,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: 'silver',
            backgroundColor: White,
            shadowColor: '#000000',
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowRadius: 1,
            shadowOpacity: 0.2,
          }}
          onValuesChange={this.multiSliderValuesChange}
          min={startTimeInMin}
          max={endTimeInMin}
          step={15}
          allowOverlap={false}
          snapped
        />
        <TouchableOpacity
          onPress={() => this.makeBooking()}
          disabled={bookingButtonDisabled}
          style={bookingButtonDisabled ? styles.searchButtonInActive : styles.searchButtonActive}
        >
          <Text style={bookingButtonDisabled ? styles.inactiveText : styles.activeText}>
            {bookingTitle[language]}
          </Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>
          {responseMessage ? 'Something went wrong.' : ''}
        </Text>
        <Text style={styles.successText}>
          {successfullyBooked ? 'Room booked! :)' : ''}
        </Text>
      </View>
    );
  }
}

export default graphql(
  gql`
    mutation book($roomName: String, $date: String, $from: String, $to: String) {
      book(roomName: $roomName, date: $date, from: $from, to: $to)
    }
  `,
  {
    props: ({ mutate }) => ({
      book: (roomName, date, from, to) => mutate({
        variables: {
          roomName, date, from, to,
        },
      }),
    }),
  },
)(BookingScreen);
