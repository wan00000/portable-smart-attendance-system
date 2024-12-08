//app/lists/_layout.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
MaterialTopTabNavigationOptions,
MaterialTopTabNavigationEventMap,
createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs';
import { TabNavigationState, ParamListBase } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTobTabs = withLayoutContext<
MaterialTopTabNavigationOptions,
typeof Navigator,
TabNavigationState<ParamListBase>,
MaterialTopTabNavigationEventMap
>(Navigator);


const Layout = () => {
    return (
        <MaterialTobTabs>
            
        </MaterialTobTabs>
    );
}

const styles = StyleSheet.create({})

export default Layout;
