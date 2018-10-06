import React, { Component } from 'react';

import { SectionList, StyleSheet, Text, View, Image, TouchableOpacity, WebView, BackHandler, NavigatorIOS } from 'react-native';



export default () => (
    <View style={{flex: 1}}>
    <WebView
        source={{
        uri: 'https://cloud.timeedit.net/chalmers/web/b1/ri1Q5008.html',
    }}
        style={{ flex: 1 }}
    />
    </View>
)
