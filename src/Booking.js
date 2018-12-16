import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import {
  Text, View, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import MultiSlider from 'react-native-multi-slider-cloneable';
import { AndroidBackHandler } from 'react-navigation-backhandler';
import {
  PrimaryColor, White,
} from '../res/values/Styles';
import { bookingTitle, bookingFailed, bookingSucceeded } from './utils/Constants';
import { styles } from './utils/Styles';


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
const getClosestQuarterInMinutes = (minutes) => {
  const wholeQuarters = Math.floor(minutes / 15);
  const quartersInMinutes = wholeQuarters * 15;
  return quartersInMinutes;
};

const adjustTime = (time) => {
  if (time === 'Nu' || time === 'Now') {
    const now = new Date();
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();
    const closestQuarter = getClosestQuarterInMinutes(nowInMinutes);
    return (closestQuarter >= 60 * 23) ? (60 * 23) : closestQuarter;
  }
  if (time === '00:00') {
    return convertTimestamptoMinutes('07:00');
  }
  if (time === '23:59') {
    return convertTimestamptoMinutes('23:00');
  }
  return convertTimestamptoMinutes(time);
};


class BookingScreen extends React.Component {
  constructor(props) {
    super(props);

    const { navigation } = this.props; // eslint-disable-line
    const { language, date, item } = navigation.state.params;

    this.state = {
      language,
      date: new Date(date),
      room: item.split(' ')[0],
      startTimeInMin: adjustTime(item.split(' ')[1]),
      endTimeInMin: adjustTime(item.split(' ')[3]),
      multiSliderValue: [adjustTime(item.split(' ')[1]), adjustTime(item.split(' ')[3])],
      bookingButtonDisabled: false,
      error: false,
      successfullyBooked: false,
      loading: false,
    };
  }

  componentDidMount() {
    const { startTimeInMin, endTimeInMin } = this.state;
    if (startTimeInMin + 240 < endTimeInMin) {
      const endTime = startTimeInMin + 240 > 60 * 23 ? 60 * 23 : startTimeInMin + 240;
      this.setState({ multiSliderValue: [startTimeInMin, endTime] });
    }
  }

  multiSliderValuesChange = (values) => {
    this.setState({
      multiSliderValue: values,
    });
    this.setState({
      bookingButtonDisabled: values[1] - values[0] > 240,
    });
  };

  onBackButtonPressAndroid = () => {
    const { successfullyBooked } = this.state;
    if (successfullyBooked) {
      const { navigation } = this.props; // eslint-disable-line
      navigation.popToTop();
      return true;
    }
    return false;
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

    try {
      this.setState({ loading: true, bookingButtonDisabled: true });
      await book(booking.roomName, booking.date, booking.from, booking.to);
    } catch (e) {
      console.log(e);
      this.setState({ error: true, loading: false });
      return false;
    }
    return true;
  }

  handleFeedback() {
    const { navigation } = this.props; // eslint-disable-line
    const { error } = this.state;
    if (!error) {
      this.setState({
        successfullyBooked: true,
        loading: false,
      });
      navigation.state.params.refresh();
    }
  }

  render() {
    const {
      room, language, multiSliderValue, startTimeInMin, endTimeInMin,
      bookingButtonDisabled, error, successfullyBooked, loading,
    } = this.state;
    return (
      <AndroidBackHandler onBackPress={this.onBackButtonPressAndroid}>
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
            onPress={() => this.makeBooking().then(() => this.handleFeedback())}
            disabled={bookingButtonDisabled}
            style={bookingButtonDisabled ? styles.searchButtonInActive : styles.searchButtonActive}
          >
            <Text style={bookingButtonDisabled ? styles.inactiveText : styles.activeText}>
              {bookingTitle[language]}
            </Text>
          </TouchableOpacity>
          <View style={{ width: '100%', height: 16 }}>
            <Text style={styles.errorText}>
              {error ? bookingFailed[language] : ''}
            </Text>
            <Text style={styles.successText}>
              {successfullyBooked ? bookingSucceeded[language] : ''}
            </Text>
          </View>
        </View>
        {loading
    && (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={PrimaryColor} />
    </View>
    )
}
      </AndroidBackHandler>
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
