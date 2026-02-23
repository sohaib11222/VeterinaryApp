// src/navigation/MainNavigator.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/mainscreens/HomeScreen";
import AppointmentScreen from "../screens/mainscreens/AppointmentScreen";
import ProfileScreen from "../screens/mainscreens/ProfileScreen";

export type MainTabParamList = {
  Home: undefined;
  Appointments: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Appointments" component={AppointmentScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
