import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {Ionicons} from "@expo/vector-icons"

const Tab = ({ icon, isSelected }) => (
    <View style={{ flex : 1 , alignItems : "center", justifyContent : "center" }}>
        <Ionicons name={icon} color={isSelected ? "black" : "grey" }
            size={30} />
    </View>
)

export default Tab
