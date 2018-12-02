import React from 'react';
import { View, WebView } from 'react-native';


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
